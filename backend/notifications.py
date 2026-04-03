"""
AI Compliance Platform - Email notification service

In production, configure SMTP_HOST / SENDGRID_API_KEY env vars.
Falls back to logging when not configured.
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
NOTIFICATION_FROM = os.getenv("NOTIFICATION_FROM", "noreply@opssightai.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@alpfr.com")


def _send_email(to: str, subject: str, body: str) -> bool:
    """Send an email via SendGrid or SMTP. Returns True on success."""

    if SENDGRID_API_KEY:
        try:
            import httpx

            response = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "personalizations": [{"to": [{"email": to}]}],
                    "from": {"email": NOTIFICATION_FROM},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": body}],
                },
                timeout=10,
            )
            if response.status_code in (200, 202):
                logger.info(f"Email sent to {to}: {subject}")
                return True
            else:
                logger.error(f"SendGrid error {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.exception(f"Failed to send email via SendGrid: {e}")
            return False

    if SMTP_HOST:
        try:
            import smtplib
            from email.mime.text import MIMEText

            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER", "")
            smtp_pass = os.getenv("SMTP_PASSWORD", "")

            msg = MIMEText(body)
            msg["Subject"] = subject
            msg["From"] = NOTIFICATION_FROM
            msg["To"] = to

            with smtplib.SMTP(SMTP_HOST, smtp_port) as server:
                server.starttls()
                if smtp_user:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(NOTIFICATION_FROM, [to], msg.as_string())

            logger.info(f"Email sent to {to}: {subject}")
            return True
        except Exception as e:
            logger.exception(f"Failed to send email via SMTP: {e}")
            return False

    # Fallback: log only (no email provider configured)
    logger.warning(
        f"[EMAIL NOT SENT — no provider configured] To: {to} | Subject: {subject} | Body: {body}"
    )
    return False


def send_admin_approval_email(user_email: str, username: str) -> bool:
    """Notify admins that a new user is awaiting approval."""
    return _send_email(
        to=ADMIN_EMAIL,
        subject=f"New Access Request: {username}",
        body=(
            f"User {username} ({user_email}) has registered and is awaiting approval.\n\n"
            f"Log in to the AI Compliance Platform admin panel to review."
        ),
    )


def send_client_activation_email(user_email: str) -> bool:
    """Notify a user that their account has been approved."""
    return _send_email(
        to=user_email,
        subject="Your AI Compliance Platform Access is Approved",
        body=(
            "Welcome to the AI Compliance Platform!\n\n"
            "Your account has been approved. You can now log in at the portal."
        ),
    )
