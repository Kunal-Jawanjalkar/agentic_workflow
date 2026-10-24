from sqlalchemy.orm import DeclarativeBase

from backend.db.base import Base


def test_base_is_declarative_base() -> None:
    assert issubclass(Base, DeclarativeBase)
