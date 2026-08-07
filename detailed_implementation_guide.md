# Detailed Implementation Guide: Multi-Agent Orchestrator (1-Hour Fast Track)

This guide maps out the exact steps to implement SQLite Database Persistence, Run History Replay, and the Evaluation Harness within your 1-hour window.

---

## 📅 Step 1: SQLite Database Persistence (`backend/db.py`)
To satisfy the P0 database persistence requirement, we create `backend/db.py` to handle the SQLite schema initialization, run saves, event logging, and retrieval.

### Action Plan
1. Define the SQLite schema matching the PDF:
   - `runs` (id, status, input_text, total_cost, total_latency_ms, created_at)
   - `steps` (id, run_id, node_id, node_label, node_type, status, output, execution_time_ms, cost, tokens, retries)
2. Add helper functions:
   - `save_run(run_id, status, input_text)`
   - `update_run_status(run_id, status, total_cost, total_latency)`
   - `save_step(run_id, step_result)`
   - `get_run(run_id)`
   - `list_runs()`

---

## 📅 Step 2: Wire Backend Router to Database (`backend/router.py`)
Replace the in-memory `state_store.py` calls in the router with `db.py` queries.

### Action Plan
1. In `POST /api/runs`, call `db.save_run()` to persist the run initializer.
2. In `POST /api/runs/{run_id}/step`, save each completed step to the database using `db.save_step()`.
3. In `GET /api/runs`, load historical runs using `db.list_runs()`.
4. In `GET /api/runs/{run_id}`, fetch details using `db.get_run()`.

---

## 📅 Step 3: Connect Run History and Implement Replay (`frontend/src/components/RunHistory.tsx`)
Connect the React UI to the new database runs and wire up a real replay diff visualization.

### Action Plan
1. In `RunHistory.tsx`, fetch real runs from `/api/runs` in the `useEffect` hook.
2. Add a `replay` action that triggers the `/api/runs/{run_id}/replay` endpoint (which we will add to the router).
3. Display the replay metrics (original vs. replayed latency, cost, and outputs) in a side-by-side modal or grid layout.

---

## 📅 Step 4: Build Evaluation Harness (`backend/router.py` & `frontend/src/components/EvaluationHarness.tsx`)
Implement the core scoring evaluation benchmark (Single-Agent Baseline vs. Multi-Agent).

### Action Plan
1. Add the `/api/eval` endpoint to `router.py`. It should:
   - Run 3 test cases against a Single-Agent block.
   - Run 3 test cases against the Multi-Agent graph.
   - Output comparative stats (latency, cost, success rate).
   - Generate a short "marginal value" report (analysis of when multi-agent is actually worth the overhead).
2. Create `EvaluationHarness.tsx` in the frontend containing a results table and a markdown card showing the marginal value summary.
3. Wire the "Evaluation" option as a nav item in the sidebar.

---

## 📅 Step 5: Enforce Private Scratch Memory (`backend/engine.py`)
Prevent nodes from reading output files of agents marked as `'scratch'`.

### Action Plan
1. Modify the context-assembly routine in `_run_agent`.
2. Inspect the `memory_scope` of parent nodes. If `'scratch'`, do not inject their output string into the child agent's LLM context window.
