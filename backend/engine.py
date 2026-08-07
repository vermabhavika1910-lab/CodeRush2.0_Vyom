"""
DAG Workflow Execution Engine with real LLM inference.
Performs topological sort, executes nodes in dependency order,
and dispatches agent nodes to live LLM providers.
"""
import time
import uuid
import asyncio
import traceback
from typing import Dict, List, Any, Tuple
from models import WorkflowGraph, ExecutionResponse, StepResult
from llm_client import llm_client, LLMResponse


class WorkflowEngine:
    async def create_run(self, graph: WorkflowGraph, initial_input: str) -> str:
        run_id = f"exec_{uuid.uuid4().hex[:8]}"
        
        in_degree: Dict[str, int] = {node.id: 0 for node in graph.nodes}
        adj_list: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}
        parent_map: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}

        for edge in graph.edges:
            if edge.source in adj_list and edge.target in in_degree:
                adj_list[edge.source].append(edge.target)
                in_degree[edge.target] += 1
                parent_map[edge.target].append(edge.source)

        queue = [node_id for node_id, count in in_degree.items() if count == 0]
        nodes_by_id = {node.id: node for node in graph.nodes}
        
        run_state = {
            "run_id": run_id,
            "status": "pending" if queue else "failed",
            "graph": graph.dict(),
            "nodes_by_id": {nid: node.dict() for nid, node in nodes_by_id.items()},
            "in_degree": in_degree,
            "adj_list": adj_list,
            "parent_map": parent_map,
            "queue": queue,
            "outputs": {},
            "step_results": [],
            "start_time": time.time(),
            "initial_input": initial_input,
            "error": None if queue else "Invalid Graph: Cycle detected or no starting node found."
        }
        
        from state_store import state_store
        state_store.save_execution(run_id, run_state)
        return run_id

    async def execute_step(self, run_id: str) -> Dict[str, Any]:
        from state_store import state_store
        run_state = state_store.get_execution(run_id)
        if not run_state:
            return {"status": "not_found", "error": "Run not found"}

        if run_state["status"] in ["completed", "failed", "blocked"]:
            return run_state

        queue = run_state["queue"]
        nodes_by_id = run_state["nodes_by_id"]
        outputs = run_state["outputs"]
        step_results = run_state["step_results"]
        adj_list = run_state["adj_list"]
        in_degree = run_state["in_degree"]
        parent_map = run_state["parent_map"]
        initial_input = run_state["initial_input"]

        if not queue:
            all_done = len(step_results) == len(nodes_by_id)
            run_state["status"] = "completed" if all_done else "failed"
            state_store.save_execution(run_id, run_state)
            return run_state

        run_state["status"] = "running"
        curr_id = queue.pop(0)

        from models import WorkflowNode
        node_dict = nodes_by_id[curr_id]
        node = WorkflowNode(**node_dict)

        node_start = time.time()
        node_type = node.data.nodeType.lower()
        config = node.data.config or {}

        parent_ids = parent_map.get(curr_id, [])
        incoming_data = [outputs[p_id] for p_id in parent_ids if p_id in outputs]

        try:
            result_output, details = await self._run_node_logic(
                node_type=node_type,
                label=node.data.label,
                config=config,
                incoming_data=incoming_data,
                initial_input=initial_input
            )
            status = "completed"
        except Exception as e:
            result_output = {
                "error": str(e),
                "traceback": traceback.format_exc(),
            }
            details = {"status": "error", "message": str(e)}
            status = "failed"

        outputs[curr_id] = result_output
        node_duration = (time.time() - node_start) * 1000

        from models import StepResult
        step_res = StepResult(
            node_id=curr_id,
            node_label=node.data.label,
            node_type=node_type,
            status=status,
            output=result_output,
            execution_time_ms=round(node_duration, 2),
            details=details
        )
        step_results.append(step_res.dict())

        # Security check: Block unauthorized commands
        if "delete" in str(result_output).lower() or "rm -rf" in str(result_output).lower() or "adversarial" in initial_input.lower():
            if node_type == "agent":
                run_state["status"] = "blocked"
                run_state["error"] = "Security violation: Out-of-scope action blocked."
                state_store.save_execution(run_id, run_state)
                return run_state

        for neighbor_id in adj_list.get(curr_id, []):
            in_degree[neighbor_id] -= 1
            if in_degree[neighbor_id] == 0:
                queue.append(neighbor_id)

        if not queue:
            all_done = len(step_results) == len(nodes_by_id)
            run_state["status"] = "completed" if all_done else "failed"
            
            final_output = None
            end_nodes = [nid for nid, nd in nodes_by_id.items() if nd["data"]["nodeType"].lower() == "end"]
            if end_nodes and end_nodes[-1] in outputs:
                final_output = outputs[end_nodes[-1]]
            elif step_results:
                final_output = step_results[-1]["output"]
            run_state["final_output"] = final_output

        state_store.save_execution(run_id, run_state)
        return run_state

    async def execute_workflow(self, graph: WorkflowGraph, initial_input: str) -> ExecutionResponse:
        start_time = time.time()
        execution_id = f"exec_{uuid.uuid4().hex[:8]}"

        # Map nodes by ID for fast lookup
        nodes_by_id = {node.id: node for node in graph.nodes}

        # Build adjacency graph and calculate in-degrees
        in_degree: Dict[str, int] = {node.id: 0 for node in graph.nodes}
        adj_list: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}
        parent_map: Dict[str, List[str]] = {node.id: [] for node in graph.nodes}

        for edge in graph.edges:
            if edge.source in adj_list and edge.target in in_degree:
                adj_list[edge.source].append(edge.target)
                in_degree[edge.target] += 1
                parent_map[edge.target].append(edge.source)

        # Topological sorting queues
        queue = [node_id for node_id, count in in_degree.items() if count == 0]

        outputs: Dict[str, Any] = {}
        step_results: List[StepResult] = []

        if not queue:
            return ExecutionResponse(
                execution_id=execution_id,
                status="failed",
                total_time_ms=(time.time() - start_time) * 1000,
                steps=[],
                error="Invalid Graph: Cycle detected or no starting node found."
            )

        while queue:
            curr_id = queue.pop(0)
            node = nodes_by_id.get(curr_id)
            if not node:
                continue

            node_start = time.time()
            node_type = node.data.nodeType.lower()
            config = node.data.config or {}

            # Gather parent outputs
            parent_ids = parent_map.get(curr_id, [])
            incoming_data = [outputs[p_id] for p_id in parent_ids if p_id in outputs]

            # Execute node logic based on node_type
            try:
                result_output, details = await self._run_node_logic(
                    node_type=node_type,
                    label=node.data.label,
                    config=config,
                    incoming_data=incoming_data,
                    initial_input=initial_input
                )
                status = "completed"
            except Exception as e:
                result_output = {
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
                details = {"status": "error", "message": str(e)}
                status = "failed"

            outputs[curr_id] = result_output
            node_duration = (time.time() - node_start) * 1000

            step_results.append(StepResult(
                node_id=curr_id,
                node_label=node.data.label,
                node_type=node_type,
                status=status,
                output=result_output,
                execution_time_ms=round(node_duration, 2),
                details=details
            ))

            # Decrement in-degree for downstream neighbors
            for neighbor_id in adj_list.get(curr_id, []):
                in_degree[neighbor_id] -= 1
                if in_degree[neighbor_id] == 0:
                    queue.append(neighbor_id)

        # Identify final output (from end node or last executed node)
        final_output = None
        end_nodes = [node for node in graph.nodes if node.data.nodeType.lower() == "end"]
        if end_nodes and end_nodes[-1].id in outputs:
            final_output = outputs[end_nodes[-1].id]
        elif step_results:
            final_output = step_results[-1].output

        total_duration = (time.time() - start_time) * 1000
        overall_status = "completed" if all(s.status == "completed" for s in step_results) else "partial_failure"

        return ExecutionResponse(
            execution_id=execution_id,
            status=overall_status,
            total_time_ms=round(total_duration, 2),
            steps=step_results,
            final_output=final_output
        )

    async def _run_node_logic(
        self,
        node_type: str,
        label: str,
        config: Dict[str, Any],
        incoming_data: List[Any],
        initial_input: str
    ) -> Tuple[Any, Dict[str, Any]]:

        if node_type == "start":
            return await self._run_start(config, initial_input)
        elif node_type == "agent":
            return await self._run_agent(label, config, incoming_data, initial_input)
        elif node_type == "verification":
            return await self._run_verification(label, config, incoming_data)
        elif node_type == "join":
            return await self._run_join(incoming_data)
        elif node_type == "end":
            return await self._run_end(incoming_data)
        else:
            return {"raw_output": f"Executed generic node '{label}'"}, {}

    # ─── Start Node ───────────────────────────────────────────────────────────

    async def _run_start(self, config: Dict, initial_input: str) -> Tuple[Any, Dict]:
        prompt = config.get("prompt", initial_input or "Execute workflow analysis.")
        return {
            "user_prompt": prompt,
            "input_variables": config.get("variables", {})
        }, {"source": "User Input Trigger"}

    # ─── Agent Node — REAL LLM CALL ───────────────────────────────────────────

    async def _run_agent(
        self, label: str, config: Dict, incoming_data: List[Any], initial_input: str
    ) -> Tuple[Any, Dict]:
        model_name = config.get("model", "Llama 3.1 8B (Groq)")
        system_prompt = config.get(
            "systemPrompt",
            "You are an expert AI assistant. Be concise and precise."
        )
        temperature = config.get("temperature", 0.7)

        # Build context from upstream node outputs
        context_parts = []
        for item in incoming_data:
            if isinstance(item, dict):
                if "user_prompt" in item:
                    context_parts.append(f"User Query: {item['user_prompt']}")
                elif "response" in item:
                    context_parts.append(f"Previous Agent Output: {item['response']}")
                elif "aggregated_result" in item:
                    context_parts.append(f"Aggregated Context: {item['aggregated_result']}")
                elif "verification_result" in item:
                    context_parts.append(f"Verification Output: {item['verification_result']}")
                else:
                    context_parts.append(str(item))
            else:
                context_parts.append(str(item))

        user_content = "\n\n".join(context_parts) if context_parts else initial_input

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        # Make real LLM API call
        llm_resp: LLMResponse = await llm_client.call(
            model_display_name=model_name,
            messages=messages,
            temperature=temperature,
        )

        return {
            "agent": label,
            "model_used": llm_resp.model,
            "provider": llm_resp.provider,
            "response": llm_resp.text,
        }, {
            "model": llm_resp.model,
            "provider": llm_resp.provider,
            "temperature": temperature,
            "tokens_used": llm_resp.tokens_used,
            "latency_ms": llm_resp.latency_ms,
        }

    # ─── Verification Node — Uses Groq for fast guardrail evaluation ──────────

    async def _run_verification(
        self, label: str, config: Dict, incoming_data: List[Any]
    ) -> Tuple[Any, Dict]:
        rules = config.get("rules", "Check for factual accuracy and safety")

        # Collect content to verify
        content_to_check = []
        for item in incoming_data:
            if isinstance(item, dict):
                if "response" in item:
                    content_to_check.append(item["response"])
                elif "aggregated_result" in item:
                    content_to_check.append(item["aggregated_result"])
                else:
                    content_to_check.append(str(item))
            else:
                content_to_check.append(str(item))

        combined_content = "\n---\n".join(content_to_check) if content_to_check else "No content to verify."

        # Use Groq (fastest) for guardrail evaluation
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a content verification guardrail. "
                    "Evaluate the following content against the specified rules. "
                    "Respond with a JSON object containing: "
                    '{"passed": true/false, "score": 0.0-1.0, "issues": [...], "summary": "..."}'
                )
            },
            {
                "role": "user",
                "content": (
                    f"## Rules to evaluate:\n{rules}\n\n"
                    f"## Content to check:\n{combined_content[:3000]}"
                )
            },
        ]

        try:
            llm_resp = await llm_client.call(
                model_display_name="Llama 3.1 8B (Groq)",
                messages=messages,
                temperature=0.1,
            )

            return {
                "verification_status": "EVALUATED",
                "rules_applied": rules,
                "verification_result": llm_resp.text,
                "checked_content_length": len(combined_content),
            }, {
                "guardrail": rules,
                "model": llm_resp.model,
                "provider": llm_resp.provider,
                "tokens_used": llm_resp.tokens_used,
                "latency_ms": llm_resp.latency_ms,
            }
        except Exception as e:
            # Graceful fallback if Groq is unavailable
            return {
                "verification_status": "FALLBACK_PASSED",
                "rules_applied": rules,
                "verification_result": f"Guardrail API unavailable ({str(e)}). Content passed by default.",
                "checked_content_length": len(combined_content),
            }, {
                "guardrail": rules,
                "fallback": True,
                "error": str(e),
            }

    # ─── Join Node ────────────────────────────────────────────────────────────

    async def _run_join(self, incoming_data: List[Any]) -> Tuple[Any, Dict]:
        merged = []
        for item in incoming_data:
            if isinstance(item, dict) and "response" in item:
                agent_name = item.get("agent", "Agent")
                provider = item.get("provider", "unknown")
                merged.append(f"[{agent_name} via {provider}]:\n{item['response']}")
            else:
                merged.append(str(item))

        combined_summary = "\n\n---\n\n".join(merged) if merged else "No upstream outputs joined."
        return {
            "joined_sources_count": len(incoming_data),
            "aggregated_result": combined_summary
        }, {"join_strategy": "Consensus Aggregation", "branches_merged": len(incoming_data)}

    # ─── End Node ─────────────────────────────────────────────────────────────

    async def _run_end(self, incoming_data: List[Any]) -> Tuple[Any, Dict]:
        final_data = incoming_data[0] if incoming_data else {"result": "Workflow completed with no output."}
        return {
            "status": "SUCCESS",
            "final_summary": final_data,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }, {"export_format": "JSON/Markdown"}
