from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn


class ApprovalConfig(BaseModel):
    message: str = Field(default="Approval required to continue")
    assignee: str | None = None


class ApprovalNode(BaseNode):
    type = "approval"
    version = 1
    label = "Approval"
    category = "human"
    icon = "user-check"
    ConfigModel = ApprovalConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = ApprovalConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
