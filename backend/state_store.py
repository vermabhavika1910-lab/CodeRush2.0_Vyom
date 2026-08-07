from typing import Dict, Any, Optional

class StateStore:
    def __init__(self):
        self._history: Dict[str, Any] = {}

    def save_execution(self, execution_id: str, data: Any):
        self._history[execution_id] = data

    def get_execution(self, execution_id: str) -> Optional[Any]:
        return self._history.get(execution_id)

    def list_executions(self):
        return list(self._history.keys())

state_store = StateStore()
