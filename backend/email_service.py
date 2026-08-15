import smtplib
from email.message import EmailMessage

from backend.config import Settings


class EmailDeliveryUnavailable(RuntimeError):
    pass


def send_password_reset_email(settings: Settings, recipient: str, token: str) -> None:
    if not settings.email_delivery_enabled:
        raise EmailDeliveryUnavailable("Email delivery is disabled")

    reset_url = f"{settings.frontend_url}/intervenant/reset-password?token={token}"
    message = EmailMessage()
    message["Subject"] = "Reinitialiser votre mot de passe APA Connect"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "Une demande de reinitialisation a ete effectuee pour votre compte "
        "APA Connect.\n\n"
        f"Utilisez ce lien dans les {settings.password_reset_ttl_minutes} minutes :\n"
        f"{reset_url}\n\n"
        "Si vous n'etes pas a l'origine de cette demande, ignorez cet email."
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_username and settings.smtp_password:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise EmailDeliveryUnavailable(
            "Password reset email delivery failed"
        ) from error
