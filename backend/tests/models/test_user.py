from backend.models.user import User


def test_user_table_name() -> None:
    assert User.__tablename__ == "users"


def test_user_email_column_is_unique() -> None:
    email_col = User.__table__.c.email

    assert email_col.unique is True
