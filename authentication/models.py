"""Models for authentication app"""

from ipaddress import ip_address

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.safestring import mark_safe
from python_ipware import IpWare

from main.models import TimestampedModel

HELP_TEXT = """
@spam.com: blocks all emails containing `@spam.com` like `joe@spam.com.edu`<br/>
@spam.com$: blocks all emails ending in `@spam.com` like `joe@spam.com`<br/>
spam.com: blocks all emails containing `spam.com` like `joe@antispam.com.edu`<br/>
sue@gmail.com: blocks `sue@gmail.com` and `bobbysue@gmail.com`<br/>
^sue@gmail.com: blocks `sue@gmail.com` but not `bobbysue@gmail.com`
"""


class BlockedEmailRegex(TimestampedModel):
    """
    An object indicating emails to block based on a matching regex string
    """

    match = models.CharField(
        max_length=256,
        null=False,
        blank=False,
        help_text=mark_safe(HELP_TEXT),  # noqa: S308
    )


class BlockedIPRange(TimestampedModel):
    """
    An object indicating ip ranges to block
    """

    ip_start = models.GenericIPAddressField(null=False, blank=False)
    ip_end = models.GenericIPAddressField(null=False, blank=False)

    def clean(self):
        ipw = IpWare()
        for ip in (self.ip_start, self.ip_end):
            if ip is None:
                msg = "IP cannot be null"
                raise ValidationError(msg, code="invalid")
            ipw_ip = ipw.parse_ip_address(ip)
            if ipw_ip.is_private:
                msg = f"IP {ip} is not routable"
                raise ValidationError(msg, code="invalid")
        if ip_address(self.ip_start) > ip_address(self.ip_end):
            msg = f"IP {self.ip_end} < IP {self.ip_start}"
            raise ValidationError(msg, code="invalid")
