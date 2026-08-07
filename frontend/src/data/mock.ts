export type AgentStatus = 'idle' | 'running' | 'success' | 'failure' | 'retry' | 'waiting';

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  icon: string;
  model: string;
  status: AgentStatus;
  inputType: string;
  outputType: string;
  tools: string[];
  memory: string;
  permissions: string[];
  tokenBudget: number;
  timeout: number;
  inputSchema: { field: string; type: string; required: boolean }[];
  outputSchema: { field: string; type: string; required: boolean }[];
}

export const MODELS = [
  'GPT-4o',
  'GPT-4o-mini',
  'Claude 3.5 Sonnet',
  'Claude 3 Opus',
  'Gemini 1.5 Pro',
  'Llama 3.1 70B',
  'Mistral Large 2',
];

export const AGENTS: AgentDef[] = [
  {
    id: 'researcher',
    name: 'Researcher',
    role: 'Gathers sources, links, and raw evidence',
    icon: 'Search',
    model: 'GPT-4o',
    status: 'success',
    inputType: 'text',
    outputType: 'sources[]',
    tools: ['web_search', 'url_fetch', 'arxiv', 'pdf_parse'],
    memory: 'vector · 14k tokens',
    permissions: ['network:read', 'storage:read'],
    tokenBudget: 24000,
    timeout: 120,
    inputSchema: [
      { field: 'query', type: 'string', required: true },
      { field: 'depth', type: 'int', required: false },
    ],
    outputSchema: [
      { field: 'sources', type: 'Source[]', required: true },
      { field: 'summary', type: 'string', required: true },
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    role: 'Synthesizes findings into structured insight',
    icon: 'LineChart',
    model: 'Claude 3.5 Sonnet',
    status: 'running',
    inputType: 'sources[]',
    outputType: 'analysis',
    tools: ['code_exec', 'sql', 'stats'],
    memory: 'rolling · 8k tokens',
    permissions: ['compute:exec'],
    tokenBudget: 18000,
    timeout: 90,
    inputSchema: [
      { field: 'sources', type: 'Source[]', required: true },
      { field: 'focus', type: 'string', required: false },
    ],
    outputSchema: [
      { field: 'analysis', type: 'Analysis', required: true },
      { field: 'confidence', type: 'float', required: true },
    ],
  },
  {
    id: 'analyst-b',
    name: 'Analyst B',
    role: 'Counterfactual & risk reviewer',
    icon: 'GitBranch',
    model: 'Claude 3 Opus',
    status: 'waiting',
    inputType: 'sources[]',
    outputType: 'risk_report',
    tools: ['code_exec', 'risk_model'],
    memory: 'rolling · 6k tokens',
    permissions: ['compute:exec'],
    tokenBudget: 16000,
    timeout: 90,
    inputSchema: [
      { field: 'sources', type: 'Source[]', required: true },
    ],
    outputSchema: [
      { field: 'risks', type: 'Risk[]', required: true },
      { field: 'mitigations', type: 'string[]', required: false },
    ],
  },
  {
    id: 'verifier',
    name: 'Verifier',
    role: 'Validates schema, evidence & consistency',
    icon: 'ShieldCheck',
    model: 'GPT-4o-mini',
    status: 'idle',
    inputType: 'analysis',
    outputType: 'verdict',
    tools: ['schema_validate', 'evidence_check', 'consistency'],
    memory: 'stateless',
    permissions: ['read:all'],
    tokenBudget: 12000,
    timeout: 60,
    inputSchema: [
      { field: 'analysis', type: 'Analysis', required: true },
      { field: 'sources', type: 'Source[]', required: true },
    ],
    outputSchema: [
      { field: 'verdict', type: 'Verdict', required: true },
      { field: 'score', type: 'float', required: true },
    ],
  },
  {
    id: 'summarizer',
    name: 'Summarizer',
    role: 'Compresses output into executive brief',
    icon: 'ScrollText',
    model: 'Gemini 1.5 Pro',
    status: 'idle',
    inputType: 'verdict',
    outputType: 'report',
    tools: ['template', 'markdown'],
    memory: 'stateless',
    permissions: ['read:all'],
    tokenBudget: 8000,
    timeout: 45,
    inputSchema: [
      { field: 'verdict', type: 'Verdict', required: true },
    ],
    outputSchema: [
      { field: 'report', type: 'Report', required: true },
    ],
  },
];

export interface WorkflowNode {
  id: string;
  type: 'start' | 'agent' | 'join' | 'report';
  label: string;
  agentId?: string;
  x: number;
  y: number;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}

export const WORKFLOW_NODES: WorkflowNode[] = [
  { id: 'start', type: 'start', label: 'START', x: 20, y: 200 },
  { id: 'research', type: 'agent', label: 'RESEARCH', agentId: 'researcher', x: 250, y: 200 },
  { id: 'analyst-a', type: 'agent', label: 'ANALYST A', agentId: 'analyst', x: 500, y: 70 },
  { id: 'analyst-b', type: 'agent', label: 'ANALYST B', agentId: 'analyst-b', x: 500, y: 330 },
  { id: 'join', type: 'join', label: 'JOIN', x: 750, y: 200 },
  { id: 'verifier', type: 'agent', label: 'VERIFIER', agentId: 'verifier', x: 980, y: 200 },
  { id: 'report', type: 'report', label: 'REPORT', agentId: 'summarizer', x: 1210, y: 200 },
];

export const WORKFLOW_EDGES: WorkflowEdge[] = [
  { id: 'e1', from: 'start', to: 'research' },
  { id: 'e2', from: 'research', to: 'analyst-a' },
  { id: 'e3', from: 'research', to: 'analyst-b' },
  { id: 'e4', from: 'analyst-a', to: 'join' },
  { id: 'e5', from: 'analyst-b', to: 'join' },
  { id: 'e6', from: 'join', to: 'verifier' },
  { id: 'e7', from: 'verifier', to: 'report' },
];

export interface ExecutionStep {
  nodeId: string;
  agent: string;
  status: AgentStatus;
  latency: number;
  tokens: number;
  cost: number;
  retries: number;
}

export const EXECUTION_STEPS: ExecutionStep[] = [
  { nodeId: 'research', agent: 'Researcher', status: 'success', latency: 4200, tokens: 18420, cost: 0.38, retries: 0 },
  { nodeId: 'analyst-a', agent: 'Analyst A', status: 'success', latency: 6800, tokens: 14200, cost: 0.52, retries: 0 },
  { nodeId: 'analyst-b', agent: 'Analyst B', status: 'retry', latency: 9100, tokens: 11800, cost: 0.41, retries: 1 },
  { nodeId: 'verifier', agent: 'Verifier', status: 'running', latency: 3200, tokens: 6400, cost: 0.12, retries: 0 },
  { nodeId: 'report', agent: 'Summarizer', status: 'waiting', latency: 0, tokens: 0, cost: 0, retries: 0 },
];

export interface RunRecord {
  id: string;
  name: string;
  timestamp: string;
  status: 'success' | 'failure' | 'partial';
  cost: number;
  latency: number;
  retries: number;
  verification: number;
}

export const RUN_HISTORY: RunRecord[] = [
  { id: 'run-042', name: 'Market entry: EU SaaS', timestamp: '2 min ago', status: 'success', cost: 1.43, latency: 23.4, retries: 0, verification: 98 },
  { id: 'run-041', name: 'Competitor pricing scan', timestamp: '1 hr ago', status: 'partial', cost: 0.96, latency: 18.1, retries: 2, verification: 84 },
  { id: 'run-040', name: 'Supply chain risk brief', timestamp: '3 hr ago', status: 'success', cost: 1.72, latency: 31.8, retries: 1, verification: 91 },
  { id: 'run-039', name: 'Regulatory diff: GDPR vs CCPA', timestamp: 'Yesterday', status: 'failure', cost: 0.54, latency: 12.2, retries: 3, verification: 47 },
  { id: 'run-038', name: 'Q3 earnings synthesis', timestamp: 'Yesterday', status: 'success', cost: 2.11, latency: 41.7, retries: 0, verification: 96 },
  { id: 'run-037', name: 'Customer churn signals', timestamp: '2 days ago', status: 'success', cost: 1.28, latency: 27.9, retries: 1, verification: 89 },
];

export const VERIFICATION = {
  score: 94,
  schemaValid: true,
  evidenceChecked: true,
  consistencyChecked: true,
  status: 'VERIFIED' as const,
};
