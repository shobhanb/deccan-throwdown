from fastapi.security import APIKeyHeader

#
# API Key Auth
#
api_key_scheme = APIKeyHeader(name="X-API-KEY")
optional_api_key_scheme = APIKeyHeader(name="X-API-KEY", auto_error=False)
