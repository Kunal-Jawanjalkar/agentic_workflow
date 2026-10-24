import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.base import Base
from backend.models.enums import TriggerType, trigger_type_check_constraint


class Workflow(Base):
    __tablename__ = "workflows"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft','active','archived')",
            name="ck_workflows_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="draft",
    )
    current_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "workflow_versions.id",
            name="fk_workflows_current_version",
            use_alter=True,
        ),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"
    __table_args__ = (
        UniqueConstraint("workflow_id", "version", name="uq_workflow_versions_workflow_id_version"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    graph: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    settings: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    change_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class Trigger(Base):
    __tablename__ = "triggers"
    __table_args__ = (trigger_type_check_constraint(),)

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[TriggerType] = mapped_column(
        Enum(TriggerType, native_enum=False, validate_strings=True),
        nullable=False,
    )
    config: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    secret_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
