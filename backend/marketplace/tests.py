from unittest.mock import patch

from django.test import RequestFactory, TestCase

from .auth_views import GoogleAuthView, RegisterView, ThrottledTokenObtainPairView
from .models import User


class GoogleAuthViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = GoogleAuthView.as_view()

    @patch("marketplace.auth_views.verify_access_token")
    @patch("marketplace.auth_views.fetch_userinfo")
    @patch("marketplace.auth_views.verify_id_token")
    @patch("marketplace.auth_views.exchange_code_for_tokens")
    def test_google_auth_uses_redirect_uri_from_request(
        self,
        exchange_code_for_tokens,
        verify_id_token,
        fetch_userinfo,
        verify_access_token,
    ):
        exchange_code_for_tokens.return_value = {
            "access_token": "google-access",
            "id_token": "google-id",
        }
        verify_id_token.return_value = {
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://example.com/avatar.png",
        }
        fetch_userinfo.return_value = {
            "email": "demo@example.com",
            "name": "Demo User",
            "picture": "https://example.com/avatar.png",
        }
        verify_access_token.return_value = None

        request = self.factory.post(
            "/api/auth/google/",
            {"code": "abc123", "redirect_uri": "http://localhost:5173"},
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        exchange_code_for_tokens.assert_called_once_with("abc123", "http://localhost:5173")


class RegisterViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = RegisterView.as_view()

    def test_register_creates_user_and_returns_tokens(self) -> None:
        request = self.factory.post(
            "/api/auth/register/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "StrongPass123",
            },
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "newuser@example.com")


class TokenObtainPairViewTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.view = ThrottledTokenObtainPairView.as_view()

    def test_login_accepts_email_instead_of_username(self) -> None:
        User.objects.create_user(
            username="demo",
            email="demo@example.com",
            password="StrongPass123",
        )

        request = self.factory.post(
            "/api/auth/token/",
            {"username": "demo@example.com", "password": "StrongPass123"},
        )

        response = self.view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
