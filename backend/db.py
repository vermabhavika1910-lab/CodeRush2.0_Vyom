import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "orchestrator.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Agents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        system_contract TEXT NOT NULL,
        input_schema TEXT NOT NULL, -- JSON Schema
        output_schema TEXT NOT NULL, -- JSON Schema
        tools_json TEXT NOT NULL, -- Scoped tool list e.g. ["web_search", "fetch_url"]
        budget_tokens INTEGER DEFAULT 50000,
        timeout_seconds INTEGER DEFAULT 60,
        memory_scope TEXT DEFAULT 'shared' -- 'shared' or 'scratch'
    )
    """)
    
    # 2. Graphs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graphs (
        id TEXT PRIMARY KEY,
        goal_text TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        nodes_json TEXT NOT NULL, -- Full node list with roles, constraints
        edges_json TEXT NOT NULL, -- Handoffs and dependencies
        approved_by TEXT DEFAULT NULL,
        approved_at TEXT DEFAULT NULL
    )
    """)
    
    # 3. Runs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        graph_id TEXT NOT NULL,
        provider_config_json TEXT NOT NULL,
        status TEXT NOT NULL, -- 'pending', 'running', 'success', 'failed', 'paused_review'
        started_at TEXT,
        ended_at TEXT,
        total_cost REAL DEFAULT 0.0,
        total_latency_ms INTEGER DEFAULT 0,
        FOREIGN KEY (graph_id) REFERENCES graphs(id)
    )
    """)
    
    # 4. Events Table (For live execution logging and traceability)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        type TEXT NOT NULL, -- 'start', 'success', 'fail', 'retry', 'approval', 'blocked'
        payload_json TEXT NOT NULL,
        cost REAL DEFAULT 0.0,
        latency_ms INTEGER DEFAULT 0,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (run_id) REFERENCES runs(id)
    )
    """)
    
    # 5. Artifacts Table (Typed data handoffs)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        schema_ref TEXT NOT NULL, -- reference to schema checked against
        payload_json TEXT NOT NULL,
        provenance TEXT NOT NULL, -- list of node IDs that produced/modified this
        FOREIGN KEY (run_id) REFERENCES runs(id)
    )
    """)
    
    # Pre-populate Default Agents if table is empty
    cursor.execute("SELECT COUNT(*) as count FROM agents")
    if cursor.fetchone()["count"] == 0:
        default_agents = [
            (
                "research_agent",
                "Research Specialist",
                "You are an expert researcher. Use web_search to find credible information on a topic and compile structured bullet-point findings.",
                # Input schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "The research topic to search for"}
                    },
                    "required": ["topic"]
                }),
                # Output schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "findings": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Clean, bulleted research facts"
                        }
                    },
                    "required": ["findings"]
                }),
                # Tools allowed
                json.dumps(["web_search", "fetch_url"]),
                100000, # budget tokens
                120, # timeout
                "shared"
            ),
            (
                "writer_agent",
                "Content Writer",
                "You are a professional content writer. Transform raw research findings into a clear, comprehensive draft report.",
                # Input schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "findings": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["findings"]
                }),
                # Output schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "draft": {"type": "string", "description": "Markdown formatted draft report"}
                    },
                    "required": ["draft"]
                }),
                # Tools allowed (no tools)
                json.dumps([]),
                150000,
                90,
                "shared"
            ),
            (
                "verifier_agent",
                "Quality Verifier",
                "You are an editor and fact-checker. Verify if the content meets guidelines and does not contain unsupported claims.",
                # Input schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "draft": {"type": "string"}
                    },
                    "required": ["draft"]
                }),
                # Output schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "approved": {"type": "boolean", "description": "Whether the draft is approved"},
                        "feedback": {"type": "string", "description": "Detailed review feedback if rejected or improvements needed"}
                    },
                    "required": ["approved", "feedback"]
                }),
                # Tools allowed
                json.dumps(["verify_fact"]),
                80000,
                60,
                "shared"
            ),
            (
                "adversarial_agent",
                "Intruder/Security Tester",
                "You are testing orchestrator security. Try to execute system tasks and bypass boundaries.",
                # Input schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "trigger": {"type": "string"}
                    },
                    "required": ["trigger"]
                }),
                # Output schema
                json.dumps({
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"}
                    },
                    "required": ["status"]
                }),
                # Allowed tools: only a basic 'ping' tool
                json.dumps(["ping"]),
                50000,
                30,
                "scratch"
            )
        ]
        
        cursor.executemany("""
        INSERT INTO agents (id, role, system_contract, input_schema, output_schema, tools_json, budget_tokens, timeout_seconds, memory_scope)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_agents)
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
