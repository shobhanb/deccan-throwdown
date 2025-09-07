import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.athletes.views import athletes_router
from app.database.base import Base
from app.database.core import session_manager
from app.events.views import events_router
from app.firebase_auth.views import firebase_auth_router
from app.scores.views import scores_router
from app.settings import env_settings, url_settings
from app.teams.views import teams_router
from app.wods.views import wods_router

log = logging.getLogger("uvicorn.error")

RESET_DB = False


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator:
    # Run pre-load stuff
    if RESET_DB:
        async with session_manager.connect() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    yield


app_configs: dict[str, Any] = {"debug": True, "title": "Deccan Throwdown API", "lifespan": lifespan}

ENVIRONMENT = env_settings.environment
DEV_ENVIRONMENTS = {"local", "dev", "test"}
if ENVIRONMENT not in DEV_ENVIRONMENTS:
    app_configs["openapi_url"] = None

app = FastAPI(**app_configs)

app.include_router(firebase_auth_router)
app.include_router(athletes_router)
app.include_router(events_router)
app.include_router(teams_router)
app.include_router(wods_router)
app.include_router(scores_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[url_settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "Ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
