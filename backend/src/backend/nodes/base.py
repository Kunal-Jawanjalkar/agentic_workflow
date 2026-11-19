from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any, ClassVar

from pydantic import BaseModel

NodeState = dict[str, Any]
NodeFn = Callable[[NodeState], NodeState]


class BaseNode(ABC):
    type: ClassVar[str]
    version: ClassVar[int] = 1
    label: ClassVar[str]
    category: ClassVar[str]
    icon: ClassVar[str]
    ConfigModel: ClassVar[type[BaseModel]]
    outputs: ClassVar[list[str]] = ["default"]

    @abstractmethod
    def build(self, config: BaseModel, ctx: Any) -> NodeFn:
        """Return the executable node function for this step."""
