from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn


class ConditionConfig(BaseModel):
    expression: str = Field(default="", description="Boolean expression over workflow state")


class ConditionNode(BaseNode):
    type = "condition"
    version = 1
    label = "Condition"
    category = "logic"
    icon = "git-branch"
    ConfigModel = ConditionConfig
    outputs = ["yes", "no"]

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = ConditionConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
