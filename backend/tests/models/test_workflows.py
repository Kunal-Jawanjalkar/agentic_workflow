from backend.models.enums import TriggerType
from backend.models.workflows import Trigger, Workflow, WorkflowVersion


def test_workflow_table_and_status_check() -> None:
    assert Workflow.__tablename__ == "workflows"
    names = {c.name for c in Workflow.__table__.constraints}

    assert "ck_workflows_status" in names


def test_workflow_version_unique_workflow_version() -> None:
    assert WorkflowVersion.__tablename__ == "workflow_versions"
    names = {c.name for c in WorkflowVersion.__table__.constraints}

    assert "uq_workflow_versions_workflow_id_version" in names


def test_trigger_type_column_uses_trigger_type_enum() -> None:
    type_col = Trigger.__table__.c.type

    assert type_col.type.enum_class is TriggerType
