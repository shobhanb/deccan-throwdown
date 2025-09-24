from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class CustomBaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class EnvSettings(CustomBaseSettings):
    environment: str = "dev"


class DBSettings(CustomBaseSettings):
    db_url: str = "sqlite+aiosqlite:///test.db"


class URLSettings(CustomBaseSettings):
    frontend_url: str = "http://localhost:4200"


class AuthSettings(CustomBaseSettings):
    admin_api_key: str = "secret"


class ResendSettings(CustomBaseSettings):
    resend_api_key: str = "secret"
    resend_from_email: EmailStr = "me@example.com"


class UserAuthSettings(CustomBaseSettings):
    reset_password_token_key: str = "secret"  # noqa: S105
    verification_token_key: str = "secret"  # noqa: S105


env_settings = EnvSettings()
db_settings = DBSettings()
url_settings = URLSettings()
auth_settings = AuthSettings()
resend_settings = ResendSettings()
user_auth_settings = UserAuthSettings()
