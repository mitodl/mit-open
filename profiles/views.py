"""Views for REST APIs for channels"""

from cairosvg import svg2png  # pylint:disable=no-name-in-module
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, get_object_or_404
from django.views.decorators.cache import cache_page
from django.views import View
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from main.permissions import (
    AnonymousAccessReadonlyPermission,
    IsStaffPermission,
)
from profiles.models import Profile, UserWebsite, ProgramCertificate, ProgramLetter
from profiles.permissions import HasEditPermission, HasSiteEditPermission
from profiles.serializers import (
    ProfileSerializer,
    UserSerializer,
    UserWebsiteSerializer,
)
from profiles.utils import DEFAULT_PROFILE_IMAGE, generate_svg_avatar


@extend_schema(exclude=True)
class UserViewSet(viewsets.ModelViewSet):
    """View for users"""

    permission_classes = (IsAuthenticated, IsStaffPermission)

    serializer_class = UserSerializer

    queryset = get_user_model().objects.filter(is_active=True)
    lookup_field = "username"


class CurrentUserRetrieveViewSet(mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """User retrieve and update viewsets for the current user"""

    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        """Return the current request user"""
        # NOTE: this may be a logged in or anonymous user
        return self.request.user


@extend_schema(exclude=True)
class ProfileViewSet(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    """View for profile"""

    permission_classes = (AnonymousAccessReadonlyPermission, HasEditPermission)
    serializer_class = ProfileSerializer
    queryset = Profile.objects.prefetch_related("userwebsite_set").filter(
        user__is_active=True
    )
    lookup_field = "user__username"

    def get_serializer_context(self):
        return {"include_user_websites": True}


@extend_schema(exclude=True)
class UserWebsiteViewSet(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """View for user websites"""

    permission_classes = (IsAuthenticated, HasSiteEditPermission)
    serializer_class = UserWebsiteSerializer
    queryset = UserWebsite.objects.select_related("profile__user")


@cache_page(60 * 60 * 24)
def name_initials_avatar_view(
    request,  # noqa: ARG001
    username,
    size,
    color,
    bgcolor,
):  # pylint:disable=unused-argument
    """View for initial avatar"""
    user = User.objects.filter(username=username).first()
    if not user:
        return redirect(DEFAULT_PROFILE_IMAGE)
    svg = generate_svg_avatar(user.profile.name, int(size), color, bgcolor)
    return HttpResponse(svg2png(bytestring=svg), content_type="image/png")


class ProgramLetterInterceptView(View):
    """
    View that generates a uuid (via ProgramLetter instance)
    and then passes the user along to the shareable letter view
    """

    @method_decorator(login_required)
    def get(self, request, *args, **kwargs):
        program_id = kwargs.get("program_id")
        certificate = get_object_or_404(
            ProgramCertificate,
            user_email=request.user.email,
            micromasters_program_id=program_id,
        )
        letter, created = ProgramLetter.objects.get_or_create(
            user=request.user, certificate=certificate
        )
        return HttpResponseRedirect(reverse("program-letter-view", args=[letter.uuid]))


class ProgramLetterDisplayView(TemplateView):
    """
    View that pulls template data from micromasters
    to render a program letter
    """

    template_name = "program_letter.html"

    @method_decorator(login_required)
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        letter_uuid = kwargs.get("uuid")
        letter = get_object_or_404(ProgramLetter, uuid=letter_uuid)
        return context
