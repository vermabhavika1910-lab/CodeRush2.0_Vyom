const API_BASE = 'http://127.0.0.1:8000/api';

export const api = {
  getAgents: async () => {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },

  compileGoal: async (goal: string, provider: string = 'mock', model: string = '') => {
    const res = await fetch(`${API_BASE}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, provider, model }),
    });
    if (!res.ok) throw new Error('Failed to compile goal');
    return res.json();
  },

  saveGraph: async (graph: any) => {
    const res = await fetch(`${API_BASE}/graphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graph),
    });
    if (!res.ok) throw new Error('Failed to save graph');
    return res.json();
  },

  createRun: async (graphId: string, provider: string = 'mock', model: string = '') => {
    const res = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph_id: graphId, provider, model }),
    });
    if (!res.ok) throw new Error('Failed to create run');
    return res.json();
  },

  listRuns: async () => {
    const res = await fetch(`${API_BASE}/runs`);
    if (!res.ok) throw new Error('Failed to list runs');
    return res.json();
  },

  getRun: async (runId: string) => {
    const res = await fetch(`${API_BASE}/runs/${runId}`);
    if (!res.ok) throw new Error('Failed to fetch run status');
    return res.json();
  },

  runStep: async (runId: string) => {
    const res = await fetch(`${API_BASE}/runs/${runId}/step`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute run step');
    return res.json();
  },

  approveReview: async (runId: string, nodeId: string, feedback: any = {}) => {
    const res = await fetch(`${API_BASE}/runs/${runId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId, feedback }),
    });
    if (!res.ok) throw new Error('Failed to approve review');
    return res.json();
  },
};
