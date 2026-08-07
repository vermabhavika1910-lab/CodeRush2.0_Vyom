# Technical Architecture: AE-03 Unified Agent Form Orchestrator

The system is designed with a clear separation between the **control plane** (compilation, user review, permission gates, execution state machine) and the **data plane** (agent executions, tool environments, provider adapters).

```
                      +------------------------------------+
                      |         Human User (UI/UX)         |
                      +------------------+-----------------+
                                         | Goal / Approval
                                         v
                      +------------------+-----------------+
                      |         Graph Compiler             |
                      +------------------+-----------------+
                                         | JSON Schema Graph
                                         v
                      +------------------+-----------------+
                      |      SQLite Persistence Layer      |
                      +------------------+-----------------+
                                         | Load / Save State
                                         v
                      +------------------+-----------------+
                      |        Execution Engine            | <---+
                      +------------------+-----------------+     |
                                         |                       |
                 +-----------------------+-----------------------+
                 |                       |                       |
                 | Resolves Input        | Sanitizes Payload     | Validates Schema
                 v                       v                       v
      +----------+-----------+ +---------+-----------+ +---------+-----------+
      |  Input Template Sub  | |  Security Boundary  | |  JSON Schema Engine  |
      +----------+-----------+ +---------+-----------+ +---------+-----------+
                 |                       |                       |
                 +-----------------------+-----------------------+
                                         | Authorized Handoff
                                         v
                      +------------------+-----------------+
                      |          Secret Broker             |
                      +------------------+-----------------+
                                         | Scoped API Key / Mock fallback
                                         v
                      +------------------+-----------------+
                      |        LLM Provider Adapter        |
                      +------------------+-----------------+
                                         | LLM JSON Response
                                         v
                      +------------------+-----------------+
                      |      Typed Message Handoff Bus     |
                      +------------------------------------+
```

---

## 1. Core Component Separation

### 🛡️ Control Plane
* **Graph Compiler (`compiler.py`)**: Responsible for analyzing the natural language request and translating it into a list of nodes (tasks) and directed edges (data handoffs).
* **Execution Engine (`engine.py`)**: Runs the graph nodes deterministically. Manages state transitions, detects runnable parallel branches, performs retries on failure, and manages pauses for manual human-in-the-loop approvals.
* **Security & Sandboxing (`security.py`)**: Intercepts tool calls and inspects messages. Enforces the strict sandbox workspace boundaries and tool allowlists.

### 💾 Data Plane
* **SQLite Database (`db.py`)**: Persists agents registry, graph structures, runs status, execution log events, and successfully completed artifacts.
* **Provider Adapter (`providers.py`)**: Standardizes interfaces to OpenAI, Anthropic, Ollama, or a local rule-based mock engine. Implements token counting, latency measuring, and JSON output formatting.
* **Typed Message Handoff Bus**: Validates the output payload of a sender node against the input schema of a receiver node before passing the message, preventing cascade failures.
