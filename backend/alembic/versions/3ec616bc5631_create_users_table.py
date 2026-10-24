"""create users table

Revision ID: 3ec616bc5631
Revises:
Create Date: 2026-10-14 15:46:59.416899

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = "3ec616bc5631"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _users_column_names() -> set[str]:
    bind = op.get_bind()
    inspector = inspect(bind)
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "users" not in inspector.get_table_names():
        op.create_table(
            "users",
            sa.Column("id", sa.Uuid(), nullable=False),
            sa.Column("email", sa.String(length=320), nullable=False),
            sa.Column("first_name", sa.String(length=100), nullable=False),
            sa.Column("last_name", sa.String(length=100), nullable=False),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column(
                "is_active",
                sa.Boolean(),
                server_default=sa.text("true"),
                nullable=False,
            ),
            sa.Column(
                "is_email_verified",
                sa.Boolean(),
                server_default=sa.text("false"),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
        return

    columns = _users_column_names()

    if "updated_at" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )

    if "is_active" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "is_active",
                sa.Boolean(),
                server_default=sa.text("true"),
                nullable=False,
            ),
        )

    if "is_email_verified" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "is_email_verified",
                sa.Boolean(),
                server_default=sa.text("false"),
                nullable=False,
            ),
        )

    index_names = {index["name"] for index in inspector.get_indexes("users")}
    if op.f("ix_users_email") not in index_names:
        op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    if "users" not in inspector.get_table_names():
        return

    index_names = {index["name"] for index in inspector.get_indexes("users")}
    if op.f("ix_users_email") in index_names:
        op.drop_index(op.f("ix_users_email"), table_name="users")

    op.drop_table("users")
