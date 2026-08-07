const API_BASE = 'http://127.0.0.1:8000/api';

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
};
