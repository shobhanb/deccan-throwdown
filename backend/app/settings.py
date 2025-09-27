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


class AdminUserSettings(CustomBaseSettings):
    admin_user_email: EmailStr = "me@example.com"


class ResendSettings(CustomBaseSettings):
    resend_api_key: str = "secret"
    resend_from_email: EmailStr = "me@example.com"


class RegistrationSettings(CustomBaseSettings):
    registration_cc_list: list[EmailStr] = ["me@example.com"]
    payment_link: str = "https://pay.example.com"
    waiver_link: str = "https://waiver.example.com"
    team_fee: int = 500


env_settings = EnvSettings()
db_settings = DBSettings()
url_settings = URLSettings()
auth_settings = AuthSettings()
admin_user_settings = AdminUserSettings()
resend_settings = ResendSettings()
registration_settings = RegistrationSettings()
