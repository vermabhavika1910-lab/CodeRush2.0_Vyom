// Uses VITE_API_URL env variable if set (for deployed build), otherwise falls back to local dev server
const API_BASE = `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/api`;

export const api = {
  executeWorkflow: async (graph: any, inputText: string = '') => {
    const res = await fetch(`${API_BASE}/workflow/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph, input_text: inputText }),
    });
    if (!res.ok) throw new Error('Failed to execute workflow');
    return res.json();
  },

  validateWorkflow: async (graph: any) => {
    const res = await fetch(`${API_BASE}/workflow/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graph),
    });
    if (!res.ok) throw new Error('Failed to validate workflow');
    return res.json();
  },

  getProviders: async () => {
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) throw new Error('Failed to fetch providers');
    return res.json();
  },

  getTemplates: async () => {
    const res = await fetch(`${API_BASE}/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  createRun: async (graph: any, inputText: string = '') => {
    const res = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graph, input_text: inputText }),
    });
    if (!res.ok) throw new Error('Failed to create run');
    return res.json();
  },

  runStep: async (runId: string) => {
    const res = await fetch(`${API_BASE}/runs/${runId}/step`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to execute step');
    return res.json();
  },

  getRunStatus: async (runId: string) => {
    const res = await fetch(`${API_BASE}/runs/${runId}`);
    if (!res.ok) throw new Error('Failed to fetch run status');
    return res.json();
  },

  listRuns: async () => {
    const res = await fetch(`${API_BASE}/runs`);
    if (!res.ok) throw new Error('Failed to fetch runs list');
    return res.json();
  },

  replayRun: async (runId: string) => {
    const res = await fetch(`${API_BASE}/runs/${runId}/replay`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to replay run');
    return res.json();
  },

  runEvaluation: async () => {
    const res = await fetch(`${API_BASE}/eval`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to run evaluation');
    return res.json();
  },
};
