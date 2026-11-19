from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn


class LlmConfig(BaseModel):
    credential_label: str = ""
    model: str
    prompt: str = ""
    structured_output: bool = False


class LlmNode(BaseNode):
    type = "llm"
    version = 1
    label = "LLM"
    category = "ai"
    icon = "sparkles"
    ConfigModel = LlmConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = LlmConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
