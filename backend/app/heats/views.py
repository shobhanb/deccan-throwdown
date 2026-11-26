from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.database.dependencies import db_dependency
from app.firebase_auth.dependencies import admin_user_or_api_key_dependency
from app.heats.schemas import HeatsDocumentModel, HeatsDocumentPutModel
from app.heats.service import get_heats_document, put_heats_document

heats_router = APIRouter(prefix="/heats", tags=["heats"])


@heats_router.get(
    "/{event_short_name}",
    response_model=HeatsDocumentModel,
    status_code=status.HTTP_200_OK,
)
async def read_heats(
    event_short_name: str,
    db_session: db_dependency,
) -> HeatsDocumentModel:
    doc = await get_heats_document(db_session, event_short_name)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Heats not found for {event_short_name}",
        )
    return doc


@heats_router.put(
    "/{event_short_name}",
    response_model=HeatsDocumentModel,
    status_code=status.HTTP_200_OK,
)
async def upsert_heats(
    event_short_name: str,
    body: HeatsDocumentPutModel,
    db_session: db_dependency,
    _: admin_user_or_api_key_dependency,
) -> HeatsDocumentModel:
    return await put_heats_document(
        db_session,
        event_short_name,
        body.payload,
        body.display,
    )
