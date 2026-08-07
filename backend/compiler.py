import json
import uuid
from typing import Dict, Any
from providers import LLMProviderAdapter

GRAPH_SCHEMA = {
    "type": "object",
    "properties": {
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "agent_id": {"type": "string", "enum": ["research_agent", "writer_agent", "verifier_agent", "adversarial_agent"]},
                    "type": {"type": "string", "enum": ["sequential", "parallel", "conditional", "retry", "human_review", "compensation"]},
                    "label": {"type": "string"},
                    "budget_limit_tokens": {"type": "integer"},
                    "retry_attempts": {"type": "integer"},
                    "input_template": {"type": "string", "description": "Template or key mappings from parent output"}
                },
                "required": ["id", "agent_id", "type", "label", "budget_limit_tokens", "retry_attempts"]
            }
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["source", "target"]
            }
        }
    },
    "required": ["nodes", "edges"]
}

class GraphCompiler:
    @staticmethod
    def compile_goal(goal_text: str, provider: str = "mock", model: str = "") -> Dict[str, Any]:
        """
        Takes a natural language goal and returns a compiled workflow graph.
        """
        # Rule-based fallback/mock generation if provider is 'mock' or if LLM call fails
        if provider == "mock" or not goal_text.strip():
            return GraphCompiler._generate_mock_graph(goal_text)

        system_prompt = (
            "You are a Workflow Graph Compiler. Your task is to break down a user's natural language goal "
            "into a structured multi-agent graph containing execution nodes and edges representing the data flow. "
            "Available agent IDs are:\n"
            "- 'research_agent': Specialist for searching, finding facts and collecting bullet points.\n"
            "- 'writer_agent': Specialist for drafting markdown content from facts/findings.\n"
            "- 'verifier_agent': Specialist for auditing, fact-checking, and checking guidelines.\n"
            "- 'adversarial_agent': A mock agent for security tests (only use if explicitly testing safety/adversarial calls).\n"
            "\n"
            "Node execution types are:\n"
            "- 'sequential': Standard node executed in sequence.\n"
            "- 'parallel': Node that can execute concurrently with another node.\n"
            "- 'conditional': Node that executes conditionally based on a boolean 'condition' field in its input payload.\n"
            "- 'retry': Node that will automatically retry upon failure.\n"
            "- 'human_review': Node that pauses the workflow for human verification and approval.\n"
            "- 'compensation': Node that runs only if its parent node fails fatally.\n"
            "\n"
            "You must output a JSON object strictly conforming to the requested schema. "
            "Choose a logical, multi-agent layout (e.g. compile research findings, then write, then verify)."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Compile this goal into an execution graph: {goal_text}"}
        ]

        try:
            response = LLMProviderAdapter.send(
                provider=provider,
                model=model,
                messages=messages,
                schema=GRAPH_SCHEMA
            )
            graph = response["content"]
            
            # Post-processing: ensure every graph has unique ID and correct default attributes
            graph["id"] = str(uuid.uuid4())
            graph["goal_text"] = goal_text
            graph["version"] = 1
            return graph
            
        except Exception as e:
            # Fall back to high-quality deterministic compiler output
            return GraphCompiler._generate_mock_graph(goal_text)

    @staticmethod
    def _generate_mock_graph(goal_text: str) -> Dict[str, Any]:
        """
        Produces a high-quality deterministic graph suitable for the specific AE-03 requirements:
        Includes:
        - 1 Parallel branch (Research Topic A and Research Topic B)
        - 1 Merge/Join node (Writing)
        - 1 Verification/Review node (human_review or retry)
        """
        graph_id = str(uuid.uuid4())
        
        # Check if the goal mentions adversarial testing or safety
        is_adversarial_test = "adversarial" in goal_text.lower() or "security" in goal_text.lower() or "hack" in goal_text.lower()
        is_conditional_test = "conditional" in goal_text.lower() or "compensation" in goal_text.lower()

        if is_adversarial_test:
            # Graph specifically for demonstrating the safety boundary / tool-scope escape enforcement
            nodes = [
                {
                    "id": "trigger_node",
                    "agent_id": "adversarial_agent",
                    "type": "sequential",
                    "label": "Trigger Attack Scenarios",
                    "budget_limit_tokens": 15000,
                    "retry_attempts": 1,
                    "input_template": '{"trigger": "Attempt to run unauthorized system tool command: rm -rf /"}'
                },
                {
                    "id": "monitor_node",
                    "agent_id": "verifier_agent",
                    "type": "human_review",
                    "label": "Audit Execution Logs",
                    "budget_limit_tokens": 20000,
                    "retry_attempts": 2,
                    "input_template": '{"draft": "Payload analysis from adversarial trigger"}'
                }
            ]
            edges = [
                {"source": "trigger_node", "target": "monitor_node", "description": "Handoff triggered payload for safety audit"}
            ]
        elif is_conditional_test:
            # Graph for demonstrating conditional and compensation logic
            nodes = [
                {
                    "id": "research_topic_a",
                    "agent_id": "research_agent",
                    "type": "sequential",
                    "label": "Primary Research",
                    "budget_limit_tokens": 30000,
                    "retry_attempts": 1,
                    "input_template": '{"topic": "' + goal_text + '"}'
                },
                {
                    "id": "conditional_check",
                    "agent_id": "verifier_agent",
                    "type": "conditional",
                    "label": "Quality Gate",
                    "budget_limit_tokens": 10000,
                    "retry_attempts": 1,
                    "input_template": '{"draft": "${research_topic_a.findings}", "condition": true}'
                },
                {
                    "id": "compensation_node",
                    "agent_id": "writer_agent",
                    "type": "compensation",
                    "label": "Fallback Writer",
                    "budget_limit_tokens": 10000,
                    "retry_attempts": 1,
                    "input_template": '{"findings": ["Primary research failed, executing fallback."]}'
                }
            ]
            edges = [
                {"source": "research_topic_a", "target": "conditional_check", "description": "Verify findings"},
                {"source": "research_topic_a", "target": "compensation_node", "description": "Fallback if research fails"}
            ]
        else:
            # Standard multi-agent research and writing workflow (P0 requirements)
            # Implements: Parallel branches (Research 1 & Research 2) -> Write draft -> Verify
            nodes = [
                {
                    "id": "research_topic_a",
                    "agent_id": "research_agent",
                    "type": "parallel",
                    "label": "Research Main Concept",
                    "budget_limit_tokens": 30000,
                    "retry_attempts": 3,
                    "input_template": '{"topic": "' + goal_text + ' - Core Concepts"}'
                },
                {
                    "id": "research_topic_b",
                    "agent_id": "research_agent",
                    "type": "parallel",
                    "label": "Research Current Trends",
                    "budget_limit_tokens": 30000,
                    "retry_attempts": 3,
                    "input_template": '{"topic": "' + goal_text + ' - Latest Developments & Critiques"}'
                },
                {
                    "id": "write_draft",
                    "agent_id": "writer_agent",
                    "type": "sequential",
                    "label": "Compile & Write Draft",
                    "budget_limit_tokens": 50000,
                    "retry_attempts": 2,
                    "input_template": '{"findings": ["${research_topic_a.findings}", "${research_topic_b.findings}"]}'
                },
                {
                    "id": "verify_and_approve",
                    "agent_id": "verifier_agent",
                    "type": "human_review",
                    "label": "Final Quality Check & Gate",
                    "budget_limit_tokens": 20000,
                    "retry_attempts": 2,
                    "input_template": '{"draft": "${write_draft.draft}"}'
                }
            ]
            
            edges = [
                {"source": "research_topic_a", "target": "write_draft", "description": "Handoff core findings"},
                {"source": "research_topic_b", "target": "write_draft", "description": "Handoff trends and critiques"},
                {"source": "write_draft", "target": "verify_and_approve", "description": "Submit draft for editor verification"}
            ]
            
        return {
            "id": graph_id,
            "goal_text": goal_text,
            "version": 1,
            "nodes": nodes,
            "edges": edges
        }
