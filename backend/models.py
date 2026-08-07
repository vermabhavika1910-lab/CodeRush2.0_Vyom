from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class WorkflowNodeData(BaseModel):
    label: str
    nodeType: str  # start, agent, verification, join, end
    config: Optional[Dict[str, Any]] = Field(default_factory=dict)

class WorkflowNode(BaseModel):
    id: str
    type: Optional[str] = "customNode"
    position: Optional[Dict[str, float]] = Field(default_factory=dict)
    data: WorkflowNodeData

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class WorkflowGraph(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class ExecutionRequest(BaseModel):
    graph: WorkflowGraph
    input_text: Optional[str] = ""

class StepResult(BaseModel):
    node_id: str
    node_label: str
    node_type: str
    status: str  # pending, running, completed, failed
    output: Optional[Any] = None
    execution_time_ms: float
    details: Optional[Dict[str, Any]] = None

class ExecutionResponse(BaseModel):
    execution_id: str
    status: str
    total_time_ms: float
    steps: List[StepResult]
    final_output: Optional[Any] = None
    error: Optional[str] = None

class TemplateWorkflow(BaseModel):
    id: str
    title: str
    description: str
    category: str
    graph: WorkflowGraph
