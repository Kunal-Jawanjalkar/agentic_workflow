from enum import StrEnum

from sqlalchemy import CheckConstraint


class TriggerType(StrEnum):
    MANUAL = "manual"
    WEBHOOK = "webhook"
    CRON = "cron"


def trigger_type_check_constraint() -> CheckConstraint:
    allowed = ", ".join(repr(member.value) for member in TriggerType)
    return CheckConstraint(f"type IN ({allowed})", name="ck_triggers_type")
