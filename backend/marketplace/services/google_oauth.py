import requests
from django.conf import settings

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def exchange_code_for_tokens(code: str, redirect_uri: str | None = None) -> dict:
    client_id = settings.GOOGLE_CLIENT_ID
    client_secret = settings.GOOGLE_CLIENT_SECRET
    redirect_uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
    if not client_id or not client_secret or not redirect_uri:
        raise ValueError("Missing Google OAuth client configuration")

    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if response.status_code != 200:
        raise ValueError("Google token exchange failed")
    return response.json()


def verify_id_token(id_token: str) -> dict:
    response = requests.get(
        GOOGLE_TOKEN_INFO_URL, params={"id_token": id_token}, timeout=10
    )
    if response.status_code != 200:
        raise ValueError("Invalid Google id_token")
    data = response.json()
    if settings.GOOGLE_CLIENT_ID and data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise ValueError("Google id_token audience mismatch")
    return data


def fetch_userinfo(access_token: str) -> dict:
    response = requests.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if response.status_code != 200:
        raise ValueError("Google userinfo fetch failed")
    return response.json()


def verify_access_token(access_token: str) -> None:
    response = requests.get(
        GOOGLE_TOKEN_INFO_URL, params={"access_token": access_token}, timeout=10
    )
    if response.status_code != 200:
        raise ValueError("Invalid Google access token")
    data = response.json()
    audience = data.get("audience") or data.get("aud")
    if settings.GOOGLE_CLIENT_ID and audience != settings.GOOGLE_CLIENT_ID:
        raise ValueError("Google access token audience mismatch")
