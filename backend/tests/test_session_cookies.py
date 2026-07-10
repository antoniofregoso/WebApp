from starlette.requests import Request
from starlette.responses import Response

from app.core.config.settings import settings
from app.core.exceptions import AuthenticationException
from app.core.security.session_cookies import (
    require_refresh_cookie,
    set_refresh_cookies,
)


def make_request(cookie: str = "", csrf_header: str | None = None) -> Request:
    headers = []
    if cookie:
        headers.append((b"cookie", cookie.encode("latin-1")))
    if csrf_header:
        headers.append(
            (
                settings.REFRESH_CSRF_HEADER_NAME.lower().encode("latin-1"),
                csrf_header.encode("latin-1"),
            )
        )
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/graphql",
            "headers": headers,
        }
    )


def test_set_refresh_cookies_uses_secure_http_only_refresh_cookie():
    response = Response()

    set_refresh_cookies(response, "raw-refresh-token")

    set_cookie_headers = response.headers.getlist("set-cookie")
    refresh_cookie = next(
        header
        for header in set_cookie_headers
        if header.startswith(f"{settings.REFRESH_COOKIE_NAME}=")
    )
    assert "HttpOnly" in refresh_cookie
    assert "Secure" in refresh_cookie
    assert "SameSite=lax" in refresh_cookie
    assert f"Path={settings.REFRESH_COOKIE_PATH}" in refresh_cookie


def test_require_refresh_cookie_validates_double_submit_csrf_token():
    request = make_request(
        "refresh_token=raw-refresh-token; refresh_csrf=csrf-token",
        csrf_header="csrf-token",
    )

    assert require_refresh_cookie(request) == "raw-refresh-token"


def test_require_refresh_cookie_rejects_missing_csrf_header():
    request = make_request("refresh_token=raw-refresh-token; refresh_csrf=csrf-token")

    try:
        require_refresh_cookie(request)
    except AuthenticationException as exc:
        assert "Invalid CSRF token" in exc.message
    else:
        raise AssertionError("Expected CSRF validation to fail")
