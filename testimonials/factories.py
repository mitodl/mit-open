"""Testing factories for testimonials"""

from factory import Faker, post_generation
from factory.django import DjangoModelFactory, ImageField

from testimonials.models import Attestation


class AttestationFactory(DjangoModelFactory):
    """Factory for attestations"""

    attestant_name = Faker("name")
    title = Faker("job")
    quote = Faker("sentences")
    publish_date = None

    avatar = ImageField()
    cover = ImageField()

    @post_generation
    def channels(self, create, extracted, **kwargs):  # noqa: ARG002
        """Add channels."""

        if not create or not extracted:
            return

        self.channels.add(*extracted)

    class Meta:
        """Meta options for the factory"""

        model = Attestation
