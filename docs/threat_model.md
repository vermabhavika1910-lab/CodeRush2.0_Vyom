# Threat Model & Security Policy: AE-03 Orchestrator

The AE-03 Orchestrator is designed as a **safe by construction** system. It assumes that agents can become adversarial or compromised, and enforces strict boundary guards at the system layer rather than relying on LLM steering prompts.

---

## 1. Safety Boundaries

### 🔑 Secret Leak Prevention (Secrets Broker)
* **Threat**: Compromised agents read system environment variables or leak raw LLM API keys through completion contexts.
* **Mitigation**: Agents are never given access to read the environment. The `SecretBroker` module parses keys on the server side and feeds them directly to the `LLMProviderAdapter`. Agent runtimes receive only transient tokens or mock contracts, ensuring API credentials never enter the chat history or completion prompt context.

### 🛠️ Scoped Tool Sandboxing
* **Threat**: An agent escapes its role constraints and calls destructive system tools (e.g., executing commands or deleting databases).
* **Mitigation**: Every agent's template declares a list of allowed tools (allowlist). When a tool execution request is sent, the orchestrator intercepts it at the message bus layer and runs:
  ```python
  ok, msg = SecurityBroker.verify_tool_call(agent_id, tool_name)
  ```
  If `tool_name` is not present in the agent's allowlist, the execution is immediately halted, the run transitions to `blocked` status, and a security alert event is logged.

### 📂 File System Sandbox
* **Threat**: A local model/agent uses path traversal (`../../etc/passwd`) to read or write files outside its declared workspace.
* **Mitigation**: Path inputs are resolved to absolute coordinates and verified to fall strictly within the agent's workspace directory:
  ```python
  abs_path.startswith(abs_workspace)
  ```
  Any traversal attempt is blocked.

### 🛡️ Adversarial Handoff Defense (Injection Shield)
* **Threat**: An agent smuggles instructions inside its data payloads to override the system prompt of a receiving agent (e.g. prompt injection containing "ignore all prior instructions").
* **Mitigation**: Before delivering any payload, the message bus sanitizes the message and scans for signature overrides (e.g., "ignore prior instructions", "system override bypass"). Malicious payloads trigger an immediate system lock.

---

## 2. Security Test Demonstration

The system includes a pre-packaged adversarial scenario:
1. Compile a goal containing the word `"adversarial"`.
2. The orchestrator spawns the `adversarial_agent`.
3. During execution, the agent attempts to trigger an unauthorized command command override (`delete_system_logs`).
4. The security engine catches the tool call, blocks the run, logs a `blocked` status, and visualizes the security report in the event dashboard.
