from backend.models.enums import TriggerType, trigger_type_check_constraint


def test_trigger_type_values_match_database_check() -> None:
    constraint = trigger_type_check_constraint()
    sql = str(constraint.sqltext)
    for member in TriggerType:
        assert repr(member.value) in sql


def test_trigger_type_has_expected_members() -> None:
    assert set(TriggerType) == {
        TriggerType.MANUAL,
        TriggerType.WEBHOOK,
        TriggerType.CRON,
    }
