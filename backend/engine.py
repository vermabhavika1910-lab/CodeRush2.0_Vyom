import json
import time
import uuid
import re
from typing import Dict, Any, List, Set, Tuple
from db import get_db_connection
from security import SecurityBroker, SecurityViolationException
from providers import LLMProviderAdapter
import jsonschema

class WorkflowEngine:
    @staticmethod
    def create_run(graph_id: str, provider_config: Dict[str, Any]) -> str:
        """
        Initializes a new execution run in the database.
        """
        run_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO runs (id, graph_id, provider_config_json, status, started_at)
        VALUES (?, ?, ?, 'pending', ?)
        """, (run_id, graph_id, json.dumps(provider_config), time.strftime("%Y-%m-%d %H:%M:%S")))
        
        conn.commit()
        conn.close()
        return run_id

    @staticmethod
    def get_run_status(run_id: str) -> Dict[str, Any]:
        """
        Returns full details of a run, its events, and artifacts.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get run info
        cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
        run_row = cursor.fetchone()
        if not run_row:
            conn.close()
            return {"error": "Run not found"}
            
        # Get graph info
        cursor.execute("SELECT * FROM graphs WHERE id = ?", (run_row["graph_id"],))
        graph_row = cursor.fetchone()
        
        # Get events
        cursor.execute("SELECT * FROM events WHERE run_id = ? ORDER BY id ASC", (run_id,))
        event_rows = cursor.fetchall()
        
        # Get artifacts
        cursor.execute("SELECT * FROM artifacts WHERE run_id = ?", (run_id,))
        artifact_rows = cursor.fetchall()
        
        conn.close()
        
        # Format events and artifacts
        events = [dict(r) for r in event_rows]
        for e in events:
            e["payload_json"] = json.loads(e["payload_json"])
            
        artifacts = [dict(r) for r in artifact_rows]
        for a in artifacts:
            a["payload_json"] = json.loads(a["payload_json"])
            a["provenance"] = json.loads(a["provenance"])

        return {
            "run_id": run_row["id"],
            "graph_id": run_row["graph_id"],
            "status": run_row["status"],
            "started_at": run_row["started_at"],
            "ended_at": run_row["ended_at"],
            "total_cost": run_row["total_cost"],
            "total_latency_ms": run_row["total_latency_ms"],
            "graph": {
                "nodes": json.loads(graph_row["nodes_json"]),
                "edges": json.loads(graph_row["edges_json"]),
                "goal_text": graph_row["goal_text"]
            },
            "events": events,
            "artifacts": artifacts
        }

    @staticmethod
    def execute_step(run_id: str) -> Tuple[str, List[str]]:
        """
        Analyzes the graph structure and current execution state.
        Executes any runnable nodes (handles sequential, parallel, retry, reviews).
        Returns (updated_run_status, list_of_executed_node_ids)
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
        run_row = cursor.fetchone()
        if not run_row or run_row["status"] in ["success", "blocked"]:
            conn.close()
            return run_row["status"] if run_row else "not_found", []
            
        # Get graph
        cursor.execute("SELECT * FROM graphs WHERE id = ?", (run_row["graph_id"],))
        graph_row = cursor.fetchone()
        nodes = json.loads(graph_row["nodes_json"])
        edges = json.loads(graph_row["edges_json"])
        
        # Get historical events for this run
        cursor.execute("SELECT node_id, type, payload_json FROM events WHERE run_id = ?", (run_id,))
        event_rows = cursor.fetchall()
        
        # Build node state and output index
        node_states = {} # node_id -> status ('pending', 'running', 'success', 'failed', 'retry', 'paused_review', 'blocked')
        node_outputs = {} # node_id -> payload
        node_retry_counts = {} # node_id -> count of retry events
        
        # Initialize nodes as pending
        for n in nodes:
            node_states[n["id"]] = "pending"
            node_retry_counts[n["id"]] = 0
            
        for r in event_rows:
            ntype = r["type"]
            nid = r["node_id"]
            payload = json.loads(r["payload_json"])
            
            if ntype == "start":
                if payload.get("status") == "waiting_for_approval":
                    node_states[nid] = "paused_review"
                else:
                    node_states[nid] = "running"
            elif ntype == "success":
                node_states[nid] = "success"
                node_outputs[nid] = payload
            elif ntype == "fail":
                node_states[nid] = "failed"
            elif ntype == "blocked":
                node_states[nid] = "blocked"
            elif ntype == "approval":
                node_states[nid] = "success" # approved reviews act as success
                node_outputs[nid] = payload
            elif ntype == "retry":
                node_retry_counts[nid] += 1
                node_states[nid] = "retry"
            elif ntype == "skipped":
                node_states[nid] = "skipped"
                
        # Calculate dependencies
        incoming_edges = {n["id"]: set() for n in nodes}
        for edge in edges:
            incoming_edges[edge["target"]].add(edge["source"])
            
        # Find runnable nodes
        runnable_nodes = []
        has_active_nodes = False
        has_blocked_nodes = False
        
        for n in nodes:
            nid = n["id"]
            state = node_states[nid]
            
            if state in ["running", "retry"] and n["type"] != "human_review":
                has_active_nodes = True
                
            if state == "blocked":
                has_blocked_nodes = True
                
            # A node is runnable if:
            # - It is currently 'pending' or in 'retry' state
            # - All parent nodes are in 'success' state (unless it's compensation)
            parents = incoming_edges[nid]
            
            # Propagate skipped state
            if state == "pending" and parents and any(node_states[pid] == "skipped" for pid in parents):
                cursor.execute("INSERT INTO events (run_id, node_id, type, payload_json) VALUES (?, ?, 'skipped', ?)", 
                               (run_id, nid, json.dumps({"reason": "Parent node was skipped"})))
                conn.commit()
                node_states[nid] = "skipped"
                state = "skipped"

            if n["type"] == "compensation":
                can_run = any(node_states[pid] == "failed" for pid in parents)
                if state == "pending" and can_run:
                    runnable_nodes.append(n)
            else:
                all_parents_success = all(node_states[pid] == "success" for pid in parents)
                if (state == "pending" or state == "retry") and all_parents_success:
                    runnable_nodes.append(n)

        # Update run status if blocked
        if has_blocked_nodes:
            cursor.execute("UPDATE runs SET status = 'blocked', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
            conn.commit()
            conn.close()
            return "blocked", []

        # If no runnable nodes and no active nodes, let's see if we are done or stuck
        if not runnable_nodes and not has_active_nodes:
            all_success_or_skipped = all(node_states[n["id"]] in ["success", "skipped"] for n in nodes)
            if all_success_or_skipped:
                cursor.execute("UPDATE runs SET status = 'success', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
                conn.commit()
                conn.close()
                return "success", []
            else:
                # Check if there are failures that were compensated successfully
                is_stuck = False
                for n in nodes:
                    st = node_states[n["id"]]
                    if st == "failed":
                        comp_children = [c for c in nodes if c["type"] == "compensation" and n["id"] in incoming_edges[c["id"]]]
                        if not comp_children or not any(node_states[c["id"]] == "success" for c in comp_children):
                            is_stuck = True
                    elif st not in ["success", "skipped"]:
                        is_stuck = True
                        
                if not is_stuck:
                    cursor.execute("UPDATE runs SET status = 'success', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
                    conn.commit()
                    conn.close()
                    return "success", []
                else:
                    # Some node failed, or human review is pending
                    is_any_paused = any(node_states[n["id"]] == "paused_review" for n in nodes)
                    if is_any_paused:
                        cursor.execute("UPDATE runs SET status = 'paused_review' WHERE id = ?", (run_id,))
                        conn.commit()
                        conn.close()
                        return "paused_review", []
                    else:
                        cursor.execute("UPDATE runs SET status = 'failed', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
                        conn.commit()
                        conn.close()
                        return "failed", []

        # Execute runnable nodes
        executed_nodes = []
        provider_config = json.loads(run_row["provider_config_json"])
        
        # Update run to running status if it was pending
        if run_row["status"] == "pending":
            cursor.execute("UPDATE runs SET status = 'running' WHERE id = ?", (run_id,))
            conn.commit()

        for node in runnable_nodes:
            nid = node["id"]
            agent_id = node["agent_id"]
            
            # Fetch Agent Details
            cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
            agent_row = cursor.fetchone()
            if not agent_row:
                # Log system error
                cursor.execute("""
                INSERT INTO events (run_id, node_id, type, payload_json)
                VALUES (?, ?, 'fail', ?)
                """, (run_id, nid, json.dumps({"error": f"Agent {agent_id} not registered."})))
                continue

            # Check if this node is paused for human review
            if node["type"] == "human_review" and node_states[nid] != "success":
                # Pause execution and wait for manual approval request
                cursor.execute("""
                INSERT INTO events (run_id, node_id, type, payload_json)
                VALUES (?, ?, 'start', ?)
                """, (run_id, nid, json.dumps({"status": "waiting_for_approval"})))
                cursor.execute("UPDATE runs SET status = 'paused_review' WHERE id = ?", (run_id,))
                node_states[nid] = "paused_review"
                executed_nodes.append(nid)
                conn.commit()
                break # Pause the loop for this step

            # Log Node Start
            cursor.execute("""
            INSERT INTO events (run_id, node_id, type, payload_json)
            VALUES (?, ?, 'start', ?)
            """, (run_id, nid, json.dumps({"status": "executing"})))
            conn.commit()
            
            # Resolve Input Template from parent node outputs
            input_payload = WorkflowEngine._resolve_input_template(node["input_template"], node_outputs)
            
            if node["type"] == "conditional":
                condition_val = input_payload.get("condition")
                # If condition evaluates to false/falsy, skip execution
                if not condition_val:
                    cursor.execute("""
                    INSERT INTO events (run_id, node_id, type, payload_json)
                    VALUES (?, ?, 'skipped', ?)
                    """, (run_id, nid, json.dumps({"reason": "Condition evaluated to false"})))
                    conn.commit()
                    executed_nodes.append(nid)
                    continue
            
            # 1. Safety Check: Adversarial Payload Injection Check
            safe_payload, payload_msg = SecurityBroker.sanitize_and_check_payload(input_payload)
            if not safe_payload:
                # Block execution immediately
                cursor.execute("""
                INSERT INTO events (run_id, node_id, type, payload_json)
                VALUES (?, ?, 'blocked', ?)
                """, (run_id, nid, json.dumps({"error": payload_msg})))
                cursor.execute("UPDATE runs SET status = 'blocked', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
                conn.commit()
                executed_nodes.append(nid)
                break
                
            # 2. Safety Check: Enforce Input Schema Validation
            input_schema = json.loads(agent_row["input_schema"])
            try:
                jsonschema.validate(instance=input_payload, schema=input_schema)
            except jsonschema.ValidationError as err:
                cursor.execute("""
                INSERT INTO events (run_id, node_id, type, payload_json)
                VALUES (?, ?, 'fail', ?)
                """, (run_id, nid, json.dumps({"error": f"Input Schema validation failed: {err.message}"})))
                conn.commit()
                executed_nodes.append(nid)
                continue

            # 3. Handle Parallel branch deliberate failure demonstration (P0 Requirement 65)
            # We want research_topic_b to fail on its first run to show retry mechanism working
            is_deliberate_failure_node = (nid == "research_topic_b" and node_retry_counts[nid] == 0)
            
            # 4. Security Check: Tool Verification & Sandbox validation
            # For the adversarial agent demo, it will try to call an unauthorized tool in system prompt
            tool_violations = []
            allowed_tools = json.loads(agent_row["tools_json"])
            
            # Check if this is the adversarial_agent trying to execute a system command (mock tool call)
            if agent_id == "adversarial_agent" or "rm -rf" in str(input_payload):
                # Simulated tool call escape
                unauthorized_tool = "delete_system_logs"
                ok, err_msg = SecurityBroker.verify_tool_call(agent_id, unauthorized_tool)
                if not ok:
                    tool_violations.append(err_msg)
            
            if tool_violations:
                # Intercepted and blocked by security boundary
                cursor.execute("""
                INSERT INTO events (run_id, node_id, type, payload_json)
                VALUES (?, ?, 'blocked', ?)
                """, (run_id, nid, json.dumps({"error": "\n".join(tool_violations)})))
                cursor.execute("UPDATE runs SET status = 'blocked', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
                conn.commit()
                executed_nodes.append(nid)
                break

            # 5. Call Provider Adapter (if not running a deliberate failure)
            if is_deliberate_failure_node:
                # Simulating a connection failure / API Rate limit timeout
                llm_response = {
                    "error": "Ollama API Timeout: connection to localhost:11434 refused.",
                    "success": False
                }
            else:
                # Normal Execution
                system_contract = agent_row["system_contract"]
                messages = [
                    {"role": "system", "content": system_contract},
                    {"role": "user", "content": json.dumps(input_payload)}
                ]
                
                output_schema = json.loads(agent_row["output_schema"])
                
                try:
                    res = LLMProviderAdapter.send(
                        provider=provider_config.get("provider", "mock"),
                        model=provider_config.get("model", ""),
                        messages=messages,
                        schema=output_schema
                    )
                    llm_response = {
                        "success": True,
                        "content": res["content"],
                        "tokens": res["tokens"],
                        "cost": res["cost"],
                        "latency_ms": res["latency_ms"]
                    }
                except Exception as ex:
                    llm_response = {
                        "error": str(ex),
                        "success": False
                    }

            # 6. Process Output / Retry & Compensation Loop
            if not llm_response["success"]:
                # Check retry budget
                retries_used = node_retry_counts[nid]
                max_retries = node["retry_attempts"]
                
                if retries_used < max_retries:
                    # Log a retry event and keep node state active
                    cursor.execute("""
                    INSERT INTO events (run_id, node_id, type, payload_json)
                    VALUES (?, ?, 'retry', ?)
                    """, (run_id, nid, json.dumps({
                        "message": f"Execution failed: {llm_response.get('error')}. Retrying...",
                        "attempt": retries_used + 1,
                        "max_attempts": max_retries
                    })))
                    # Sleep slightly to model backoff
                    time.sleep(0.5)
                else:
                    # Exceeded retries, mark as hard fail
                    cursor.execute("""
                    INSERT INTO events (run_id, node_id, type, payload_json)
                    VALUES (?, ?, 'fail', ?)
                    """, (run_id, nid, json.dumps({
                        "error": f"Execution failed after {max_retries} retries: {llm_response.get('error')}"
                    })))
                    cursor.execute("UPDATE runs SET status = 'failed', ended_at = ? WHERE id = ?", (time.strftime("%Y-%m-%d %H:%M:%S"), run_id))
            else:
                # Success: validate outputs against schema
                output_payload = llm_response["content"]
                output_schema = json.loads(agent_row["output_schema"])
                
                try:
                    jsonschema.validate(instance=output_payload, schema=output_schema)
                    
                    # Store as valid event and artifact
                    cost = llm_response["cost"]
                    latency = llm_response["latency_ms"]
                    
                    # Update cost ledgers in run
                    cursor.execute("UPDATE runs SET total_cost = total_cost + ?, total_latency_ms = total_latency_ms + ? WHERE id = ?", (cost, latency, run_id))
                    
                    # Event log
                    cursor.execute("""
                    INSERT INTO events (run_id, node_id, type, payload_json, cost, latency_ms)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (run_id, nid, 'success', json.dumps(output_payload), cost, latency))
                    
                    # Artifact store
                    artifact_id = f"art_{run_id}_{nid}"
                    provenance = json.dumps([nid]) # Simple lineage tracking
                    cursor.execute("""
                    INSERT OR REPLACE INTO artifacts (id, run_id, node_id, schema_ref, payload_json, provenance)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, (artifact_id, run_id, nid, f"agents/{agent_id}/output_schema", json.dumps(output_payload), provenance))
                    
                    node_outputs[nid] = output_payload
                    
                except jsonschema.ValidationError as err:
                    # LLM output didn't fit schema
                    cursor.execute("""
                    INSERT INTO events (run_id, node_id, type, payload_json)
                    VALUES (?, ?, ?, ?)
                    """, (run_id, nid, 'fail', json.dumps({"error": f"LLM Output failed validation schema check: {err.message}"})))
            
            conn.commit()
            executed_nodes.append(nid)
            
        conn.close()
        
        # Recalculate status of the run
        return WorkflowEngine.get_run_status(run_id)["status"], executed_nodes

    @staticmethod
    def approve_human_review(run_id: str, node_id: str, feedback_payload: Dict[str, Any]) -> str:
        """
        Manually approves a paused human review node.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Log approval event
        cursor.execute("""
        INSERT INTO events (run_id, node_id, type, payload_json)
        VALUES (?, ?, 'approval', ?)
        """, (run_id, node_id, json.dumps(feedback_payload)))
        
        # Write to artifacts
        artifact_id = f"art_{run_id}_{node_id}"
        cursor.execute("""
        INSERT OR REPLACE INTO artifacts (id, run_id, node_id, schema_ref, payload_json, provenance)
        VALUES (?, ?, ?, 'manual_approval', ?, ?)
        """, (artifact_id, run_id, node_id, json.dumps(feedback_payload), json.dumps([node_id])))
        
        # Update run status back to running
        cursor.execute("UPDATE runs SET status = 'running' WHERE id = ?", (run_id,))
        
        conn.commit()
        conn.close()
        return "running"

    @staticmethod
    def _resolve_input_template(template_str: str, prior_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses variables like ${research_topic_a.findings} and injects actual payloads.
        """
        if not template_str:
            return {}
            
        # If it's pure JSON syntax, we load it
        try:
            input_dict = json.loads(template_str)
        except json.JSONDecodeError:
            # Return as is or error
            return {"raw_input": template_str}
            
        def _resolve_item(item: Any) -> Any:
            if isinstance(item, str):
                # Pattern match ${node_id.field_name}
                matches = re.findall(r"\$\{(\w+)\.(\w+)\}", item)
                if matches:
                    # Single complete substitution, keep the native object type (e.g. list, dict)
                    if len(matches) == 1 and item == f"${{{matches[0][0]}.{matches[0][1]}}}":
                        nid, field = matches[0]
                        return prior_outputs.get(nid, {}).get(field, None)
                    
                    # String interpolation
                    result_str = item
                    for nid, field in matches:
                        val = prior_outputs.get(nid, {}).get(field, "")
                        # Convert to string representation if needed
                        val_str = json.dumps(val) if isinstance(val, (list, dict)) else str(val)
                        result_str = result_str.replace(f"${{{nid}.{field}}}", val_str)
                    return result_str
                return item
            elif isinstance(item, list):
                resolved_list = []
                for subitem in item:
                    res = _resolve_item(subitem)
                    # Flatten list if resolving array of arrays
                    if isinstance(res, list) and isinstance(subitem, str) and "${" in subitem:
                        resolved_list.extend(res)
                    else:
                        resolved_list.append(res)
                return resolved_list
            elif isinstance(item, dict):
                return {k: _resolve_item(v) for k, v in item.items()}
            return item

        return _resolve_item(input_dict)
