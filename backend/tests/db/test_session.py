from backend.db.session import get_db


def test_get_db_yields_session_and_closes() -> None:
    generator = get_db()
    session = next(generator)

    try:
        assert session is not None
        assert session.is_active
    finally:
        generator.close()
