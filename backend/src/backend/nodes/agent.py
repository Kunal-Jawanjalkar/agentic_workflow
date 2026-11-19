from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn


class AgentConfig(BaseModel):
    credential_label: str = ""
    model: str = "gpt-4o-mini"
    system_prompt: str = ""
    tools: list[str] = Field(default_factory=list)


class AgentNode(BaseNode):
    type = "agent"
    version = 1
    label = "Agent"
    category = "ai"
    icon = "robot"
    ConfigModel = AgentConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = AgentConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
