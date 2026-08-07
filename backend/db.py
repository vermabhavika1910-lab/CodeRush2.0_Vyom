import sqlite3
import json
import os
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "orchestrator.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create agents table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        role TEXT,
        system_contract TEXT,
        input_schema TEXT,
        output_schema TEXT,
        tools_json TEXT,
        budget_tokens INTEGER,
        timeout_s INTEGER,
        memory_scope TEXT
    )
    """)

    # Create graphs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS graphs (
        id TEXT PRIMARY KEY,
        goal_text TEXT,
        version TEXT,
        nodes_json TEXT,
        edges_json TEXT,
        approved_by TEXT,
        approved_at TEXT
    )
    """)

    # Create runs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        graph_id TEXT,
        provider_config_json TEXT,
        status TEXT,
        started_at TEXT,
        ended_at TEXT,
        total_cost REAL,
        total_latency_ms REAL,
        goal TEXT,
        queue_json TEXT,
        in_degree_json TEXT,
        outputs_json TEXT,
        parent_map_json TEXT,
        adj_list_json TEXT
    )
    """)

    # Create events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT,
        node_id TEXT,
        type TEXT,
        payload_json TEXT,
        cost REAL,
        latency_ms REAL,
        ts TEXT
    )
    """)

    # Create artifacts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        run_id TEXT,
        node_id TEXT,
        schema_ref TEXT,
        payload_json TEXT,
        provenance TEXT
    )
    """)

    conn.commit()
    conn.close()

# Run database setup
init_db()

def create_run(run_id, graph_data, goal, initial_queue, in_degree, parent_map, adj_list):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO runs (id, status, started_at, goal, queue_json, in_degree_json, parent_map_json, adj_list_json, outputs_json, provider_config_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        "pending",
        str(time.time()),
        goal,
        json.dumps(initial_queue),
        json.dumps(in_degree),
        json.dumps(parent_map),
        json.dumps(adj_list),
        json.dumps({}),
        json.dumps(graph_data)
    ))
    conn.commit()
    conn.close()

def get_run(run_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def update_run_state(run_id, status, queue, in_degree, outputs, ended_at=None, total_cost=0.0, total_latency_ms=0.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE runs 
    SET status = ?, queue_json = ?, in_degree_json = ?, outputs_json = ?, ended_at = ?, total_cost = ?, total_latency_ms = ?
    WHERE id = ?
    """, (
        status,
        json.dumps(queue),
        json.dumps(in_degree),
        json.dumps(outputs),
        ended_at,
        total_cost,
        total_latency_ms,
        run_id
    ))
    conn.commit()
    conn.close()

def save_event(run_id, node_id, type_name, payload, cost=0.0, latency_ms=0.0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO events (run_id, node_id, type, payload_json, cost, latency_ms, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        run_id,
        node_id,
        type_name,
        json.dumps(payload),
        cost,
        latency_ms,
        str(time.time())
    ))
    conn.commit()
    conn.close()

def get_events(run_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM events WHERE run_id = ?", (run_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def list_runs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, status, goal, started_at, total_cost, total_latency_ms FROM runs ORDER BY started_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]
