from backend.models.credentials import Credential


def test_credential_table_name() -> None:
    assert Credential.__tablename__ == "credentials"


def test_credential_has_owner_name_unique_constraint() -> None:
    names = {c.name for c in Credential.__table__.constraints}

    assert "uq_credentials_owner_id_name" in names
