from typing import Literal

from pydantic import BaseModel, Field

from backend.nodes.base import BaseNode, NodeFn

HttpMethod = Literal["GET", "POST", "PUT", "PATCH", "DELETE"]


class HttpConfig(BaseModel):
    url: str = ""
    method: HttpMethod = "GET"
    headers: dict[str, str] = Field(default_factory=dict)
    body: str | None = None


class HttpNode(BaseNode):
    type = "http"
    version = 1
    label = "HTTP"
    category = "io"
    icon = "world-www"
    ConfigModel = HttpConfig

    def build(self, config: BaseModel, ctx: object) -> NodeFn:
        _ = HttpConfig.model_validate(config)

        def run(state: dict) -> dict:
            return state

        return run
