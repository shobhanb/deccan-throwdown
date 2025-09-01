from __future__ import annotations

import re
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any, Self
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Uuid, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, selectinload
from sqlalchemy.orm.attributes import QueryableAttribute

from app.database.exceptions import not_found_error


class Base(DeclarativeBase):
    __abstract__ = True

    @classmethod
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return resolve_table_name(cls.__name__)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=lambda: uuid4())

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        nullable=False,
        sort_order=-2,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
        sort_order=-1,
    )

    @classmethod
    async def all(cls, async_session: AsyncSession) -> Sequence[Self]:
        result = await async_session.execute(select(cls))
        return result.scalars().all()

    @classmethod
    async def delete_all(cls, async_session: AsyncSession) -> None:
        stmt = delete(cls)
        await async_session.execute(stmt)

    async def delete(self, async_session: AsyncSession) -> None:
        await async_session.delete(self)
        await async_session.commit()

    async def update(self, async_session: AsyncSession, **kwargs: dict[str, Any]) -> Self:
        for key, value in kwargs.items():
            setattr(self, key, value)
        await async_session.commit()
        return self

    @classmethod
    async def find(
        cls,
        async_session: AsyncSession,
        select_relationships: list[QueryableAttribute] | None = None,
        **kwargs,  # noqa: ANN003
    ) -> Self | None:
        stmt = select(cls).filter_by(**kwargs)
        if select_relationships:
            stmt = stmt.options(*[selectinload(r) for r in select_relationships])
        return await async_session.scalar(stmt)

    @classmethod
    async def find_or_raise(
        cls,
        async_session: AsyncSession,
        select_relationships: list[QueryableAttribute] | None = None,
        **kwargs,  # noqa: ANN003
    ) -> Self:
        resp = await cls.find(async_session, select_relationships, **kwargs)
        if not resp:
            raise not_found_error(msg=f"{cls.__name__} not found")
        return resp

    @classmethod
    async def find_all(
        cls,
        async_session: AsyncSession,
        select_relationships: list[QueryableAttribute] | None = None,
        **kwargs,  # noqa: ANN003
    ) -> Sequence[Self]:
        stmt = select(cls).filter_by(**kwargs)
        if select_relationships:
            stmt = stmt.options(*[selectinload(r) for r in select_relationships])
        result = await async_session.execute(stmt)
        return result.scalars().all()

    @classmethod
    async def find_with_nested_relationships(
        cls,
        async_session: AsyncSession,
        nested_relationships: list[Any] | None = None,
        **kwargs,  # noqa: ANN003
    ) -> Self | None:
        """
        Find a single record with deeply nested relationships.

        Args:
            async_session: The database session
            nested_relationships: List of nested selectinload options
            **kwargs: Filter criteria

        Example:
            # Load Event with Teams (including Athletes and Scores) and Wods (including Scores)
            event = await Events.find_with_nested_relationships(
                async_session=db_session,
                nested_relationships=[
                    selectinload(Events.teams).selectinload(Teams.athletes),
                    selectinload(Events.teams).selectinload(Teams.scores),
                    selectinload(Events.wods).selectinload(Wods.scores),
                ],
                id=event_id
            )
        """
        stmt = select(cls).filter_by(**kwargs)
        if nested_relationships:
            stmt = stmt.options(*nested_relationships)
        return await async_session.scalar(stmt)

    @classmethod
    async def find_or_raise_with_nested_relationships(
        cls,
        async_session: AsyncSession,
        nested_relationships: list[Any] | None = None,
        **kwargs,  # noqa: ANN003
    ) -> Self:
        """
        Find a single record with deeply nested relationships or raise an exception if not found.

        Args:
            async_session: The database session
            nested_relationships: List of nested selectinload options
            **kwargs: Filter criteria

        Example:
            # Load Event with Teams (including Athletes and Scores) and Wods (including Scores)
            event = await Events.find_or_raise_with_nested_relationships(
                async_session=db_session,
                nested_relationships=[
                    selectinload(Events.teams).selectinload(Teams.athletes),
                    selectinload(Events.teams).selectinload(Teams.scores),
                    selectinload(Events.wods).selectinload(Wods.scores),
                ],
                id=event_id
            )
        """
        resp = await cls.find_with_nested_relationships(async_session, nested_relationships, **kwargs)
        if not resp:
            raise not_found_error(msg=f"{cls.__name__} not found")
        return resp


def resolve_table_name(name: str) -> str:
    """Resolves table names to their mapped names."""
    names = re.split("(?=[A-Z])", name)
    return "_".join([x.lower() for x in names if x])
