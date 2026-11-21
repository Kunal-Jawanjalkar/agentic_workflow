from backend.schemas.workflows import CreateWorkflowRequest, UpdateWorkflowRequest, WorkflowGraphSchema
from backend.services.workflows import (
    create_draft_workflow,
    get_workflow_for_owner,
    list_workflows_for_owner,
    update_draft_workflow,
    workflow_summary,
)
from backend.models.user import User


def test_create_draft_workflow_persists_version_one_graph(db_session, register_payload) -> None:
    user = User(
        email=register_payload["email"],
        hashed_password="hash",
        first_name=register_payload["first_name"],
        last_name=register_payload["last_name"],
    )
    db_session.add(user)
    db_session.commit()

    workflow = create_draft_workflow(
        db_session,
        user,
        CreateWorkflowRequest(name="My flow", description=None),
    )

    assert workflow.status == "draft"
    assert workflow.current_version_id is not None
    loaded = get_workflow_for_owner(db_session, user.id, workflow.id)
    assert loaded.name == "My flow"


def test_update_draft_workflow_merges_graph(db_session, register_payload) -> None:
    user = User(
        email=register_payload["email"],
        hashed_password="hash",
        first_name=register_payload["first_name"],
        last_name=register_payload["last_name"],
    )
    db_session.add(user)
    db_session.commit()

    workflow = create_draft_workflow(db_session, user, CreateWorkflowRequest())
    graph = WorkflowGraphSchema(
        nodes=[{"id": "trigger-1", "type": "workflow", "position": {"x": 0, "y": 0}, "data": {}}],
        edges=[],
    )
    updated = update_draft_workflow(
        db_session,
        user,
        workflow.id,
        UpdateWorkflowRequest(graph=graph, name="Renamed"),
    )

    assert updated.name == "Renamed"
    from backend.services.workflows import workflow_response

    response = workflow_response(db_session, updated)
    assert len(response.graph.nodes) == 1


def test_list_workflows_for_owner_is_ordered_by_updated_at(db_session, register_payload) -> None:
    user = User(
        email=register_payload["email"],
        hashed_password="hash",
        first_name=register_payload["first_name"],
        last_name=register_payload["last_name"],
    )
    db_session.add(user)
    db_session.commit()

    first = create_draft_workflow(db_session, user, CreateWorkflowRequest(name="First"))
    second = create_draft_workflow(db_session, user, CreateWorkflowRequest(name="Second"))
    update_draft_workflow(
        db_session,
        user,
        first.id,
        UpdateWorkflowRequest(name="First renamed"),
    )

    listed = list_workflows_for_owner(db_session, user.id)
    assert [item.name for item in listed.workflows] == ["First renamed", "Second"]


def test_workflow_summary_reads_trigger_type_from_graph(db_session, register_payload) -> None:
    user = User(
        email=register_payload["email"],
        hashed_password="hash",
        first_name=register_payload["first_name"],
        last_name=register_payload["last_name"],
    )
    db_session.add(user)
    db_session.commit()

    workflow = create_draft_workflow(db_session, user, CreateWorkflowRequest())
    graph = WorkflowGraphSchema(
        nodes=[
            {
                "id": "trigger-1",
                "type": "workflow",
                "position": {"x": 0, "y": 0},
                "data": {"type": "trigger", "config": {"trigger_type": "webhook"}},
            }
        ],
        edges=[],
    )
    update_draft_workflow(db_session, user, workflow.id, UpdateWorkflowRequest(graph=graph))
    loaded = get_workflow_for_owner(db_session, user.id, workflow.id)
    summary = workflow_summary(db_session, loaded)

    assert summary.trigger_type == "webhook"