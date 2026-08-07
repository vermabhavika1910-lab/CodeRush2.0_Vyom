# Reproducibility & Execution Guide

Follow these steps to spin up the AE-03 Orchestrator locally, run the verification test suite, and run the evaluation benchmark harness.

---

## 🚀 1. Backend Server Setup

Ensure Python 3.10+ is installed. Navigate to the `backend` directory:

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Run Unit Tests**:
   Verify the engine, compiler, retries, and security layers:
   ```bash
   python test_orchestrator.py
   ```
3. **Start FastAPI Application**:
   ```bash
   python main.py
   ```
   The backend server will run on `http://127.0.0.1:8000`.

---

## 💻 2. Frontend Application Setup

Ensure Node.js 18+ is installed. Navigate to the `frontend` directory:

1. **Install npm dependencies**:
   ```bash
   npm install
   ```
2. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   The application UI will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔍 3. Live Demo Walkthrough Steps

### Happy Path: Research & Writer Parallel Workflow
1. Open the UI. On the **Goal Decomposer** panel, click **AI Policy** (or enter: `"Research Artificial Intelligence safety constraints and draft a policy report"`).
2. Click **Compile Goal to Graph**.
3. View the compiled 4-node graph. Modify node parameters (e.g. adjust token budgets, or select different agent roles) as desired.
4. Click **Lock Schema & Approve**. This registers the graph and creates the run.
5. Click **Auto Step Graph**.
   - Watch the two parallel research nodes execute.
   - Note that **`research_topic_b`** deliberately fails on its first attempt to show the retry loop. It automatically sleeps, retries, and succeeds!
   - Watch the **`write_draft`** sequential node compile the parent research outputs.
   - The graph will pause at **`verify_and_approve`** (human review node).
6. Under the **Human Verification** panel, review the draft and click **Approve & Resume**.
7. The run status updates to `success` and the final cost and latency ledgers freeze.

### Security Path: Adversarial Attack Blocking
1. Enter the goal: `"Run adversarial security test"`.
2. Click **Compile Goal to Graph** -> click **Lock Schema & Approve**.
3. Click **Execute Step** or **Auto Step**.
4. Watch the `adversarial_agent` run and attempt to call the unauthorized tool command.
5. The orchestrator immediately catches the breach, marks the node and run as **`blocked`**, and dumps the detailed security logs onto the dashboard event logs.
