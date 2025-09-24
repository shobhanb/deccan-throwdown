from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

import resend
from fastapi import BackgroundTasks, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import BaseUserDatabase, SQLAlchemyBaseUserTableUUID
from fastapi_users.password import PasswordHelperProtocol
from fastapi_users_db_sqlalchemy.access_token import SQLAlchemyBaseAccessTokenTableUUID
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.settings import resend_settings, url_settings, user_auth_settings

log = logging.getLogger("uvicorn.error")

if TYPE_CHECKING:
    pass


class AuthBase(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, AuthBase):
    name: Mapped[str] = mapped_column(String)


class AccessToken(SQLAlchemyBaseAccessTokenTableUUID, AuthBase):
    pass


class UserManager(UUIDIDMixin, BaseUserManager[User, UUID]):
    reset_password_token_secret = user_auth_settings.reset_password_token_key
    verification_token_secret = user_auth_settings.verification_token_key

    def __init__(
        self,
        user_db: BaseUserDatabase[User, UUID],
        background_tasks: BackgroundTasks,
        password_helper: PasswordHelperProtocol | None = None,
    ) -> None:
        super().__init__(user_db, password_helper)
        self.background_tasks = background_tasks

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        log.info("Registered user %s", user.email)
        await self.request_verify(user=user)
        return await super().on_after_register(user, request)

    async def on_after_request_verify(self, user: User, token: str, request: Request | None = None) -> None:
        self.background_tasks.add_task(send_verification_email, user=user, token=token)
        return await super().on_after_request_verify(user, token, request)

    async def on_after_forgot_password(self, user: User, token: str, request: Request | None = None) -> None:
        self.background_tasks.add_task(send_forgot_password_email, user=user, token=token)
        return await super().on_after_forgot_password(user, token, request)


async def send_verification_email(user: User, token: str) -> None:
    params: resend.Emails.SendParams = {
        "from": resend_settings.resend_from_email,
        "to": [user.email],
        "subject": "Verify your email",
        "html": f"""
        <html>
            <body>
                <h1>Hi {user.name},</h1>
                <h2>Welcome to Deccan Throwdown!</h2>
                <p>Thank you for signing up as admin. Please verify your email by clicking the link below:</p>
                <a href="{url_settings.frontend_url}/auth/verify-email?token={token}">Verify Email</a>
                <br />
                <p>If you did not sign up for this account, please ignore this email.</p>
            </body>
        </html>
        """,
    }

    email_id: resend.Emails.SendResponse = resend.Emails.send(params)
    log.info("Sent verification email to %s, email id: %s", user.email, email_id)


async def send_forgot_password_email(user: User, token: str) -> None:
    params: resend.Emails.SendParams = {
        "from": resend_settings.resend_from_email,
        "to": [user.email],
        "subject": "Reset your password",
        "html": f"""
        <html>
            <body>
                <h1>Password Reset Request</h1>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                <a href="{url_settings.frontend_url}/auth/reset-password?token={token}">Reset Password</a>
                <br />
                <p>If you did not request a password reset, please ignore this email.</p>
            </body>
        </html>
        """,
    }

    email_id = resend.Emails.send(params)
    log.info("Sent forgot password email to %s, email id: %s", user.email, email_id)
