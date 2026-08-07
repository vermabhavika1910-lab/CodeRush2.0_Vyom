from fastapi import APIRouter, HTTPException
from models import ExecutionRequest, ExecutionResponse, TemplateWorkflow, WorkflowGraph
from engine import WorkflowEngine
from llm_client import get_providers_and_models

router = APIRouter(prefix="/api")
engine = WorkflowEngine()

@router.post("/workflow/execute", response_model=ExecutionResponse)
async def run_workflow(request: ExecutionRequest):
    try:
        response = await engine.execute_workflow(request.graph, request.input_text or "")
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")

@router.post("/workflow/validate")
async def validate_workflow(graph: WorkflowGraph):
    nodes_count = len(graph.nodes)
    edges_count = len(graph.edges)
    
    start_nodes = [n for n in graph.nodes if n.data.nodeType.lower() == "start"]
    end_nodes = [n for n in graph.nodes if n.data.nodeType.lower() == "end"]
    
    warnings = []
    if not start_nodes:
        warnings.append("Missing a Start Node.")
    if not end_nodes:
        warnings.append("Missing an End Node.")
        
    return {
        "valid": len(warnings) == 0,
        "nodes_count": nodes_count,
        "edges_count": edges_count,
        "warnings": warnings
    }

@router.get("/providers")
async def get_providers():
    """Return available LLM providers and their models."""
    return get_providers_and_models()

@router.get("/templates")
async def get_preset_templates():
    return [
        {
            "id": "template_content_creation",
            "title": "⚡ Multi-Agent Content Studio",
            "description": "Parallel research agent + creative writer agent joined by a verification guardrail.",
            "category": "Content Generation",
            "graph": {
                "nodes": [
                    {"id": "node_1", "type": "customNode", "position": {"x": 100, "y": 200}, "data": {"label": "User Input", "nodeType": "start", "config": {"prompt": "Write a tech review of quantum computing innovations in 2026."}}},
                    {"id": "node_2", "type": "customNode", "position": {"x": 420, "y": 100}, "data": {"label": "Research Agent", "nodeType": "agent", "config": {"model": "Llama 3.1 8B (Groq)", "systemPrompt": "Gather facts, stats, and key milestones."}}},
                    {"id": "node_3", "type": "customNode", "position": {"x": 420, "y": 320}, "data": {"label": "Creative Writer Agent", "nodeType": "agent", "config": {"model": "Llama 3.3 70B (Groq)", "systemPrompt": "Draft engaging tone and polished narrative."}}},
                    {"id": "node_4", "type": "customNode", "position": {"x": 750, "y": 210}, "data": {"label": "Synthesizer Join", "nodeType": "join", "config": {}}},
                    {"id": "node_5", "type": "customNode", "position": {"x": 1020, "y": 210}, "data": {"label": "Toxicity & Fact Check", "nodeType": "verification", "config": {"rules": "Factuality check & tone evaluator"}}},
                    {"id": "node_6", "type": "customNode", "position": {"x": 1300, "y": 210}, "data": {"label": "Final Output", "nodeType": "end", "config": {}}}
                ],
                "edges": [
                    {"id": "e1-2", "source": "node_1", "target": "node_2"},
                    {"id": "e1-3", "source": "node_1", "target": "node_3"},
                    {"id": "e2-4", "source": "node_2", "target": "node_4"},
                    {"id": "e3-4", "source": "node_3", "target": "node_4"},
                    {"id": "e4-5", "source": "node_4", "target": "node_5"},
                    {"id": "e5-6", "source": "node_5", "target": "node_6"}
                ]
            }
        },
        {
            "id": "template_code_review",
            "title": "🛡️ Automated Code Auditor Team",
            "description": "Security scanner agent & performance analyzer working together.",
            "category": "Software Engineering",
            "graph": {
                "nodes": [
                    {"id": "n1", "type": "customNode", "position": {"x": 100, "y": 200}, "data": {"label": "Pull Request Diff", "nodeType": "start", "config": {"prompt": "Analyze PR #402 for security flaws and memory leaks."}}},
                    {"id": "n2", "type": "customNode", "position": {"x": 450, "y": 120}, "data": {"label": "Security Auditor Agent", "nodeType": "agent", "config": {"model": "Llama 3.1 8B (Groq)", "systemPrompt": "Scan for OWASP vulnerabilities and SQL injections."}}},
                    {"id": "n3", "type": "customNode", "position": {"x": 450, "y": 300}, "data": {"label": "Performance Optimizer Agent", "nodeType": "agent", "config": {"model": "Llama 3.3 70B (Groq)", "systemPrompt": "Check Big-O complexity and caching strategy."}}},
                    {"id": "n4", "type": "customNode", "position": {"x": 800, "y": 200}, "data": {"label": "Compliance Verification", "nodeType": "verification", "config": {"rules": "Ensure zero High/Critical security vulnerabilities."}}},
                    {"id": "n5", "type": "customNode", "position": {"x": 1100, "y": 200}, "data": {"label": "Audit Report Output", "nodeType": "end", "config": {}}}
                ],
                "edges": [
                    {"id": "e1-2", "source": "n1", "target": "n2"},
                    {"id": "e1-3", "source": "n1", "target": "n3"},
                    {"id": "e2-4", "source": "n2", "target": "n4"},
                    {"id": "e3-4", "source": "n3", "target": "n4"},
                    {"id": "e4-5", "source": "n4", "target": "n5"}
                ]
            }
        }
    ]
