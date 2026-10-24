import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.db.base import Base


class Credential(Base):
    __tablename__ = "credentials"
    __table_args__ = (
        UniqueConstraint("owner_id", "name", name="uq_credentials_owner_id_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_blob: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="1",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
