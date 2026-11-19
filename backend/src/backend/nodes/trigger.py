from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn


class TriggerConfig(BaseModel):
    trigger_type: str = Field(default="manual", description="manual | webhook | schedule")


class TriggerNode(BaseNode):
    type = "trigger"
    version = 1
    label = "Trigger"
    category = "trigger"
    icon = "bolt"
    ConfigModel = TriggerConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = TriggerConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
