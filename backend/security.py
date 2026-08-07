import os
import json
import re
from typing import Dict, Any, List, Tuple
from db import get_db_connection

class SecurityViolationException(Exception):
    pass

class SecurityBroker:
    @staticmethod
    def get_api_key(provider: str) -> str:
        """
        Retrieves API keys safely. Agents never have access to this function.
        Only the provider adapter calls this.
        """
        env_var_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY"
        }
        var_name = env_var_map.get(provider.lower())
        if var_name:
            # Mask key in normal logs, return raw only to internal adapter
            return os.environ.get(var_name, "")
        return ""

    @staticmethod
    def verify_tool_call(agent_id: str, tool_name: str) -> Tuple[bool, str]:
        """
        Validates if the agent with agent_id is authorized to execute tool_name.
        Enforces tool sandboxing and scope allowlisting.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT tools_json, role FROM agents WHERE id = ?", (agent_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return False, f"Agent '{agent_id}' not found in registry."
            
        allowed_tools = json.loads(row["tools_json"])
        role = row["role"]
        
        # Check tool scope allowlist
        if tool_name not in allowed_tools:
            # Security breach! Log and raise
            msg = f"SECURITY BREACH DETECTED: Agent '{role}' ({agent_id}) attempted to invoke unauthorized tool '{tool_name}'! Allowed tools: {allowed_tools}"
            return False, msg
            
        return True, "Tool call authorized."

    @staticmethod
    def sanitize_and_check_payload(payload: Any) -> Tuple[bool, str]:
        """
        Scans data handoff payloads for potential prompt injection or system commands.
        Ensures agents cannot smuggle instructions like 'ignore previous directives' or command escape sequences.
        """
        payload_str = json.dumps(payload).lower()
        
        # List of adversarial patterns (e.g., prompt injections, system commands)
        adversarial_patterns = [
            r"ignore\s+(?:all\s+)?prior\s+instructions",
            r"system\s+(?:override|bypass)",
            r"sudo\s+rm\s+",
            r"format\s+c:",
            r"execute\s+(?:system|shell)\s+command",
            r"delete\s+system\s+",
            r"curl\s+http",
            r"wget\s+http"
        ]
        
        for pattern in adversarial_patterns:
            if re.search(pattern, payload_str):
                return False, f"ADVERSARIAL INJECTION DETECTED: Payload matched forbidden signature pattern '{pattern}'"
                
        return True, "Payload verified as safe."
        
    @staticmethod
    def check_workspace_boundary(file_path: str, allowed_workspace_dir: str = None) -> bool:
        """
        Ensures local agent execution is sandboxed to a declared workspace directory.
        Prevents path traversal attacks (e.g. reading ../../etc/passwd).
        """
        if not allowed_workspace_dir:
            # Default sandbox workspace
            allowed_workspace_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "workspace")
            if not os.path.exists(allowed_workspace_dir):
                os.makedirs(allowed_workspace_dir)
                
        abs_path = os.path.abspath(file_path)
        abs_workspace = os.path.abspath(allowed_workspace_dir)
        
        # Check if the path is inside the allowed directory
        return abs_path.startswith(abs_workspace)
