from __future__ import annotations

import logging
import urllib.parse as urlparse
from functools import lru_cache
from urllib.parse import quote

import httpx

from app.settings import registration_settings

from .schemas import TeamRegistrationModel

log = logging.getLogger("uvicorn.error")


def add_domain_redirect(link: str) -> str:
    encoded_target = quote(link, safe="")
    parsed = urlparse.urlparse(registration_settings.domain_redirect_url)
    base = urlparse.urlunparse(parsed._replace(query="", fragment=""))
    return f"{base}?link={encoded_target}"


@lru_cache(maxsize=16)
def _resolve_razorpay_page_base(bare_link: str) -> str:
    """Expand rzp.io short links; query params on short URLs are dropped on redirect."""
    if not _is_razorpay_short_link(bare_link):
        return bare_link

    try:
        response = httpx.get(bare_link, follow_redirects=True, timeout=15.0)
        final = urlparse.urlparse(str(response.url))
    except httpx.HTTPError:
        log.exception("Failed to resolve Razorpay payment short link: %s", bare_link)
        return bare_link

    if "razorpay.com" not in final.netloc:
        log.warning(
            "Razorpay short link %s resolved to unexpected host %s",
            bare_link,
            final.netloc,
        )
        return bare_link

    return urlparse.urlunparse(final._replace(query="", fragment=""))


def _is_razorpay_short_link(url: str) -> bool:
    host = urlparse.urlparse(url).netloc.casefold()
    return host == "rzp.io" or host.endswith(".rzp.io")


def _payment_page_base(configured_link: str) -> str:
    parsed = urlparse.urlparse(configured_link)
    bare = urlparse.urlunparse(parsed._replace(query="", fragment=""))
    return _resolve_razorpay_page_base(bare)


def get_payment_link(team: TeamRegistrationModel, *, use_early_bird_fee: bool) -> str:
    configured = (
        registration_settings.early_bird_payment_link
        if use_early_bird_fee
        else registration_settings.payment_link
    )
    page_base = _payment_page_base(configured)

    captain = team.athletes[0]
    query: dict[str, str] = {
        "email": captain.email,
        "team_name": team.team_name,
    }
    if captain.phone_number:
        query["phone"] = captain.phone_number

    payment_url = f"{page_base}?{urlparse.urlencode(query, quote_via=quote)}"
    return add_domain_redirect(payment_url)
