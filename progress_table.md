# AE-03 Unified Agent Form Orchestrator - Gap Analysis & Progress Table

This progress table evaluates the current codebase implementation against the **AE-03 Winning Blueprint** requirements.

## 📊 Phase 1: Gap Analysis Checklist

| Item | Status | Notes |
|:---|:---:|:---|
| 1. Core Application: Pick LLM (commercial/local), state goal, compile to graph, execute with visible state/budget/permissions. | ✅ Done | Fully implemented across backend compiler, providers, and frontend dashboards. |
| 2. Provider Abstraction: Commercial API support + local model (Ollama) with rate-limit/retry and streaming adapter. | ✅ Done | Adapters for OpenAI, Anthropic, Ollama, Groq, OpenRouter, Google, and GitHub are completed in `providers.py`. |
| 3. Agent Templates: Schema defining role, contract, I/O schema, tools allowlist, budgets, timeouts, and memory scope. | ✅ Done | Handled via the database registry schema in `db.py`. |
| 4. Task-to-graph Compiler: Decomposes natural language goal into nodes and edges, with first-class human edit/lock/approve step. | ✅ Done | Active compiler block with edit inputs and approval controls in frontend. |
| 5. Execution Engine: Functioning sequential, parallel, retry (with backoff), human-review, conditional, and compensation nodes. | ✅ Done | Functional backend execution engine supporting all 6 nodes (and implicit join dependencies). |
| 6. Typed Message Bus: Enforces strict JSON Schema validation on inter-agent handoffs, rejecting and logging invalid payloads. | ✅ Done | Implemented via `jsonschema.validate` at agent handoff borders in `engine.py`. |
| 7. Memory Management: Shared project memory (provenance tagged) and private scratch memory (private, non-shared state). | ⚠️ Partial | Database supports memory scope, but the engine does not enforce private scratch sandboxing (all node outputs are shared). |
| 8. Observability Dashboard: Live graph state, cost, latency, retries, and blocked events. | ⚠️ Partial | UI has dashboard panels, but runs in online mode do a single long-awaited POST request instead of polling state changes live. |
| 9. Trace & Replay: Re-run a saved scenario from stored config and show side-by-side cost/latency/output delta comparison. | ⚠️ Partial | Backend `/api/runs/{id}/replay` exists, but the frontend `RunHistory` is mocked/stateless and doesn't wire up real replay/diffing. |
| 10. Evaluation Harness: Run 3-5 fixed tasks through single vs multi-agent, output results table, and report marginal-value note. | ⚠️ Partial | Backend `/api/eval` is complete, but there is no frontend tab or component rendering the results table and marginal-value note. |
| 11. Safety Boundary: Keys in secret broker, tool allowlist enforcement, sandboxed execution, and adversarial call blocking. | ✅ Done | Completed via `.env` isolation, `SecurityBroker` allowlist audit, and adversarial trigger logging. |
| 12. Required Deliverables: `architecture.md`, `threat_model.md`, `reproducibility.md`. | ✅ Done | All 3 markdown files are present in the `/docs` folder. |

## 🔍 Critical Gaps Summary (Prioritized)
1. **Evaluation Harness UI:** Backend `/api/eval` is finished, but needs a dedicated frontend tab and metrics table.
2. **Stateless Run History & Replay:** Frontend `RunHistory.tsx` is completely mocked and must be wired to backend database runs and `/replay` diff API.
3. **Live Run Step-by-Step Polling:** Execution loop in frontend must poll step-by-step to show node color states and token/cost ledgers ticking live.
4. **Memory Scope Sandbox Enforcement:** Backend engine must isolate outputs of agents with `memory_scope = 'scratch'`.
