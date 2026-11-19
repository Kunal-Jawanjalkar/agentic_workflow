from typing import Literal

from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn

NotifyChannel = Literal["email", "slack", "webhook"]


class NotifyConfig(BaseModel):
    channel: NotifyChannel = "email"
    to: str = ""
    subject: str = ""
    body: str = ""


class NotifyNode(BaseNode):
    type = "notify"
    version = 1
    label = "Notify"
    category = "io"
    icon = "bell"
    ConfigModel = NotifyConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = NotifyConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
