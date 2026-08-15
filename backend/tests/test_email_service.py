from email import message_from_bytes

import pytest

from backend.config import Settings
from backend.email_service import EmailDeliveryUnavailable, send_password_reset_email

BASE_ENV = {
    "APP_ENV": "test",
    "JWT_SECRET": "test-secret",
    "MONGO_URL": "mongodb://localhost:27017",
    "DB_NAME": "apa_connect_test",
    "CORS_ALLOWED_ORIGINS": "http://localhost:3000",
    "EMAIL_DELIVERY_ENABLED": "true",
    "SMTP_HOST": "smtp.example.test",
    "SMTP_PORT": "587",
    "SMTP_USERNAME": "mailer",
    "SMTP_PASSWORD": "not-a-real-secret",
    "SMTP_FROM_EMAIL": "contact@example.test",
    "FRONTEND_URL": "https://apaconnect.fr",
}


class FakeSmtp:
    sent_message = None
    tls_started = False
    credentials = None

    def __init__(self, host, port, timeout):
        assert host == "smtp.example.test"
        assert port == 587
        assert timeout == 15

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def starttls(self):
        type(self).tls_started = True

    def login(self, username, password):
        type(self).credentials = (username, password)

    def send_message(self, message):
        type(self).sent_message = message


def test_password_reset_email_contains_frontend_link(monkeypatch):
    settings = Settings.from_env(BASE_ENV)
    monkeypatch.setattr("backend.email_service.smtplib.SMTP", FakeSmtp)

    send_password_reset_email(settings, "user@example.test", "one-time-token")

    message = message_from_bytes(FakeSmtp.sent_message.as_bytes())
    assert message["To"] == "user@example.test"
    assert "https://apaconnect.fr/intervenant/reset-password?token=one-time-token" in (
        message.get_payload()
    )
    assert FakeSmtp.tls_started is True
    assert FakeSmtp.credentials == ("mailer", "not-a-real-secret")


def test_password_reset_email_is_disabled_by_default():
    settings = Settings.from_env(
        {
            key: value
            for key, value in BASE_ENV.items()
            if key != "EMAIL_DELIVERY_ENABLED"
        }
    )

    with pytest.raises(EmailDeliveryUnavailable):
        send_password_reset_email(settings, "user@example.test", "token")
