import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Settings, 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  ListRestart, 
  Layers, 
  Database, 
  Compass, 
  Eye, 
  Check, 
  Activity, 
  FileText,
  UserCheck,
  Zap
} from 'lucide-react';

interface Agent {
  id: string;
  role: string;
  system_contract: string;
  input_schema: any;
  output_schema: any;
  tools_json: string[];
  budget_tokens: number;
  timeout_seconds: number;
  memory_scope: string;
}

interface Node {
  id: string;
  agent_id: string;
  type: string;
  label: string;
  budget_limit_tokens: number;
  retry_attempts: number;
  input_template: string;
}

interface Edge {
  source: string;
  target: string;
  description: string;
}

interface Graph {
  id: string;
  goal_text: string;
  version: number;
  nodes: Node[];
  edges: Edge[];
}

interface EventLog {
  id: number;
  node_id: string;
  type: string;
  payload_json: any;
  cost: number;
  latency_ms: number;
  ts: string;
}

interface Artifact {
  id: string;
  run_id: string;
  node_id: string;
  schema_ref: string;
  payload_json: any;
  provenance: string[];
}

interface RunStatus {
  run_id: string;
  graph_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_cost: number;
  total_latency_ms: number;
  graph: Graph;
  events: EventLog[];
  artifacts: Artifact[];
}

interface RunSummary {
  id: string;
  graph_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  total_cost: number;
  total_latency_ms: number;
  goal_text: string;
}

interface ReplayResult {
  status: string;
  original_run_id: string;
  replayed_run_id: string;
  final_status: string;
  steps_taken: number;
}

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'build' | 'runs' | 'eval'>('build');
  
  // Registry / Schema
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Graph Compiler State
  const [goal, setGoal] = useState<string>('Research Artificial Intelligence safety constraints and draft a policy report');
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedModel, setSelectedModel] = useState<string>('mock-model');
  const [compiledGraph, setCompiledGraph] = useState<Graph | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isGraphApproved, setIsGraphApproved] = useState<boolean>(false);
  
  // Execution State
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunStatus | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionInterval, setExecutionInterval] = useState<number | null>(null);
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(false);
  
  // History State
  const [historicalRuns, setHistoricalRuns] = useState<RunSummary[]>([]);
  const [selectedReplayRun, setSelectedReplayRun] = useState<string>('');
  const [replayDetails, setReplayDetails] = useState<ReplayResult | null>(null);
  const [originalRunCompare, setOriginalRunCompare] = useState<RunStatus | null>(null);
  const [replayedRunCompare, setReplayedRunCompare] = useState<RunStatus | null>(null);
  
  // Evaluation Harness State
  const [evalResults, setEvalResults] = useState<any[]>([]);
  const [evalSummary, setEvalSummary] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  
  // UI Panels State
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [selectedLogPayload, setSelectedLogPayload] = useState<any>(null);
  const [humanFeedback, setHumanFeedback] = useState<string>('The draft is well written. Approved.');
  
  const backendUrl = 'http://127.0.0.1:8000';
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runDetails?.events]);

  // Load registered agents and history on mount
  useEffect(() => {
    fetchAgents();
    fetchHistory();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/agents`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Failed to fetch agents', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/runs`);
      if (res.ok) {
        const data = await res.json();
        setHistoricalRuns(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  // 1. Goal compile function
  const handleCompile = async () => {
    setIsCompiling(true);
    setCompiledGraph(null);
    setIsGraphApproved(false);
    try {
      const res = await fetch(`${backendUrl}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal,
          provider: selectedProvider,
          model: selectedModel
        })
      });
      if (res.ok) {
        const graph = await res.json();
        setCompiledGraph(graph);
      } else {
        alert('Compilation failed');
      }
    } catch (err) {
      alert('Cannot connect to backend server. Make sure FastAPI server is running on port 8000.');
    } finally {
      setIsCompiling(false);
    }
  };

  // 2. Edit node parameters before approval
  const handleNodeEdit = (nodeId: string, field: keyof Node, value: any) => {
    if (!compiledGraph) return;
    const updatedNodes = compiledGraph.nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, [field]: value };
      }
      return n;
    });
    setCompiledGraph({ ...compiledGraph, nodes: updatedNodes });
  };

  // 3. Approve Graph and Initialize Execution Run
  const handleApproveAndInitialize = async () => {
    if (!compiledGraph) return;
    try {
      // Step A: Save Graph Configuration
      const saveRes = await fetch(`${backendUrl}/api/graphs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compiledGraph)
      });
      
      if (!saveRes.ok) throw new Error('Failed to save graph');
      const { graph_id } = await saveRes.json();
      
      // Step B: Create Run
      const runRes = await fetch(`${backendUrl}/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph_id: graph_id,
          provider: selectedProvider,
          model: selectedModel
        })
      });
      
      if (!runRes.ok) throw new Error('Failed to create execution run');
      const { run_id } = await runRes.json();
      
      setCurrentRunId(run_id);
      setIsGraphApproved(true);
      
      // Fetch initial status
      await fetchRunStatus(run_id);
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Error initializing graph execution');
    }
  };

  // 4. Fetch Run Details
  const fetchRunStatus = async (runId: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/runs/${runId}`);
      if (res.ok) {
        const data = await res.json();
        setRunDetails(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch run details', err);
    }
    return null;
  };

  // 5. Execute Next Step in Graph Engine
  const executeNextStep = async (runId: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/runs/${runId}/step`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const updated = await fetchRunStatus(runId);
        
        // Stop auto stepping if run has finished or failed
        if (updated && ['success', 'failed', 'blocked', 'paused_review'].includes(updated.status)) {
          stopAutoStep();
        }
        return updated;
      }
    } catch (err) {
      console.error('Step execution error', err);
      stopAutoStep();
    }
    return null;
  };

  // 6. Auto-stepping control
  const startAutoStep = (runId: string) => {
    if (isAutoStepping) return;
    setIsAutoStepping(true);
    const interval = window.setInterval(async () => {
      const run = await executeNextStep(runId);
      if (!run || ['success', 'failed', 'blocked', 'paused_review'].includes(run.status)) {
        clearInterval(interval);
        setIsAutoStepping(false);
      }
    }, 1200); // 1.2s per execution step for realistic visualization
    setExecutionInterval(interval);
  };

  const stopAutoStep = () => {
    if (executionInterval) {
      clearInterval(executionInterval);
      setExecutionInterval(null);
    }
    setIsAutoStepping(false);
  };

  // 7. Human Review Approve/Reject
  const handleHumanReviewSubmit = async (approved: boolean) => {
    if (!currentRunId || !runDetails) return;
    // Find paused node ID
    const pausedNode = runDetails.graph.nodes.find(
      n => runDetails.events.some(e => e.node_id === n.id && e.type === 'start' && !runDetails.events.some(se => se.node_id === n.id && se.type === 'approval'))
    );
    if (!pausedNode) return;
    
    try {
      const res = await fetch(`${backendUrl}/api/runs/${currentRunId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node_id: pausedNode.id,
          feedback: {
            approved: approved,
            feedback: humanFeedback
          }
        })
      });
      
      if (res.ok) {
        // Fetch new status
        await fetchRunStatus(currentRunId);
        // Resume auto step if it was active
        startAutoStep(currentRunId);
      }
    } catch (err) {
      console.error('Human review submission error', err);
    }
  };

  // 8. Replay Run & Compare
  const handleReplay = async () => {
    if (!selectedReplayRun) return;
    setReplayDetails(null);
    setOriginalRunCompare(null);
    setReplayedRunCompare(null);
    try {
      // A: Fetch original run details
      const origData = await fetchRunStatus(selectedReplayRun);
      if (origData) setOriginalRunCompare(origData);
      
      // B: Trigger Replay
      const res = await fetch(`${backendUrl}/api/runs/${selectedReplayRun}/replay`, {
        method: 'POST'
      });
      if (res.ok) {
        const data: ReplayResult = await res.json();
        setReplayDetails(data);
        
        // C: Fetch replayed run details
        const repData = await fetchRunStatus(data.replayed_run_id);
        if (repData) setReplayedRunCompare(repData);
        
        fetchHistory();
      }
    } catch (err) {
      alert('Error triggering replay');
    }
  };

  // 9. Run Evaluation Harness
  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setEvalResults([]);
    try {
      const res = await fetch(`${backendUrl}/api/eval`);
      if (res.ok) {
        const data = await res.json();
        setEvalResults(data.results);
        setEvalSummary(data.marginal_value_summary);
      }
    } catch (err) {
      alert('Error running evaluation harness');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Helper to map node state to class color
  const getNodeState = (nodeId: string): 'pending' | 'running' | 'success' | 'failed' | 'retry' | 'paused_review' | 'blocked' => {
    if (!runDetails) return 'pending';
    const nodeEvents = runDetails.events.filter(e => e.node_id === nodeId);
    if (nodeEvents.length === 0) return 'pending';
    
    // Sort events by ID
    const sorted = [...nodeEvents].sort((a, b) => a.id - b.id);
    const lastEvent = sorted[sorted.length - 1];
    
    if (lastEvent.type === 'start') {
      // If human review node and status is paused, return paused
      if (lastEvent.payload_json.status === 'waiting_for_approval') {
        return 'paused_review';
      }
      return 'running';
    }
    if (lastEvent.type === 'retry') return 'retry';
    if (lastEvent.type === 'blocked') return 'blocked';
    if (lastEvent.type === 'success' || lastEvent.type === 'approval') return 'success';
    return 'failed';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between rounded-none">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/30">
            <Layers className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AE-03 Unified Agent Form Orchestrator
              <span className="badge badge-running text-[10px] py-0.5 px-1.5 font-mono">v1.0.0</span>
            </h1>
            <p className="text-xs text-gray-400">Typed Handoffs, Sandboxed Execution, & Governance Control Surface</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1">
          <button 
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'build' ? 'bg-cyan-500 text-black shadow-glow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('build')}
          >
            <Compass className="inline w-3.5 h-3.5 mr-1.5" /> Compiler & Control Room
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'runs' ? 'bg-cyan-500 text-black shadow-glow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => { setActiveTab('runs'); fetchHistory(); }}
          >
            <ListRestart className="inline w-3.5 h-3.5 mr-1.5" /> Trace & Replay Center
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'eval' ? 'bg-cyan-500 text-black shadow-glow' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('eval')}
          >
            <Zap className="inline w-3.5 h-3.5 mr-1.5" /> Eval Harness
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 grid grid-cols-1 gap-6 bg-[#070b13] overflow-auto">
        
        {activeTab === 'build' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Compiler Setup (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Intent Decomposer Panel */}
              <div className="glass-panel p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Compass className="text-cyan-400 w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">1. Goal Decomposer</h2>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-semibold">Enter Natural Language Goal:</label>
                  <textarea 
                    className="form-input h-24 resize-none"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="E.g., Research quantum cryptography and output a safety report..."
                  />
                  <div className="flex gap-2 mt-1">
                    <button 
                      className="text-[10px] bg-gray-900 border border-gray-800 hover:border-gray-700 px-2 py-1 rounded text-gray-400"
                      onClick={() => setGoal('Research artificial intelligence safety guidelines and draft a policy document')}
                    >
                      AI Policy
                    </button>
                    <button 
                      className="text-[10px] bg-gray-900 border border-gray-800 hover:border-gray-700 px-2 py-1 rounded text-gray-400"
                      onClick={() => setGoal('Attempt to run unauthorized system tool command: rm -rf /')}
                    >
                      Adversarial Attack
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-semibold">Provider Model:</label>
                    <select 
                      className="form-input text-xs"
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                    >
                      <option value="mock">Local Simulation (Mock)</option>
                      <option value="ollama">Ollama (Local Llama)</option>
                      <option value="openai">OpenAI (GPT-4o)</option>
                      <option value="anthropic">Anthropic (Claude 3.5)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-semibold">Model ID Name:</label>
                    <input 
                      type="text" 
                      className="form-input text-xs"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      placeholder="e.g. gpt-4o-mini"
                    />
                  </div>
                </div>

                <button 
                  className="btn-primary w-full justify-center mt-2"
                  onClick={handleCompile}
                  disabled={isCompiling}
                >
                  <RefreshCw className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
                  {isCompiling ? 'Decomposing Goal...' : 'Compile Goal to Graph'}
                </button>
              </div>

              {/* Template Parameters Editor Panel */}
              {compiledGraph && (
                <div className="glass-panel p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Settings className="text-amber-400 w-4 h-4" />
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white">2. Governance Gates</h2>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Graph ID: {compiledGraph.id.slice(0,8)}</span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                    {compiledGraph.nodes.map((node) => (
                      <div key={node.id} className="border border-gray-800 rounded-lg p-3 bg-gray-900/60 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white font-mono">{node.id}</span>
                          <span className="badge badge-pending text-[9px]">{node.type}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400">Agent Template</label>
                            <select 
                              className="form-input text-[11px] py-1 px-1.5"
                              value={node.agent_id}
                              onChange={(e) => handleNodeEdit(node.id, 'agent_id', e.target.value)}
                            >
                              {agents.map(a => (
                                <option key={a.id} value={a.id}>{a.role}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400">Retry Budget</label>
                            <input 
                              type="number" 
                              className="form-input text-[11px] py-1 px-1.5"
                              value={node.retry_attempts}
                              onChange={(e) => handleNodeEdit(node.id, 'retry_attempts', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400">Token Budget Limit</label>
                          <input 
                            type="number" 
                            className="form-input text-[11px] py-1 px-1.5"
                            value={node.budget_limit_tokens}
                            onChange={(e) => handleNodeEdit(node.id, 'budget_limit_tokens', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn-primary w-full justify-center bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10 text-black"
                    onClick={handleApproveAndInitialize}
                    disabled={isGraphApproved}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isGraphApproved ? 'Graph Schema Approved' : 'Lock Schema & Approve'}
                  </button>
                </div>
              )}
            </div>

            {/* Middle Column: Visual Execution Room (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-panel p-5 min-h-[480px] flex flex-col justify-between">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="text-cyan-400 w-4 h-4" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-white">Execution Board</h2>
                  </div>
                  {runDetails && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400">Status:</span>
                      <span className={`badge badge-${runDetails.status}`}>{runDetails.status}</span>
                    </div>
                  )}
                </div>

                {/* Graph Visualisation Workspace */}
                <div className="flex-1 flex items-center justify-center py-6 relative bg-gray-950/40 border border-gray-900 rounded-lg my-4 overflow-hidden min-h-[300px]">
                  {!compiledGraph ? (
                    <div className="text-center p-4">
                      <Layers className="mx-auto text-gray-700 w-12 h-12 mb-3" />
                      <p className="text-xs text-gray-500">Compile a natural language goal first to generate the visual orchestration blueprint.</p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-around gap-6 p-4">
                      {/* We render a beautiful simple static node graph */}
                      {/* Topic A & B in left column, Draft in middle, Verifier in right */}
                      {compiledGraph.nodes.some(n => n.id === 'trigger_node') ? (
                        // Adversarial Attack Flow (2 nodes)
                        <div className="flex items-center justify-center gap-16">
                          {compiledGraph.nodes.map((node) => {
                            const state = getNodeState(node.id);
                            return (
                              <div key={node.id} className={`node-card ${state}`}>
                                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">{node.id}</span>
                                  <span className={`badge badge-${state} text-[8px] py-0`}>{state}</span>
                                </div>
                                <h3 className="text-xs font-bold text-white mb-1.5">{node.label}</h3>
                                <div className="flex flex-col gap-0.5 text-[9px] text-gray-400 font-mono">
                                  <div>Budget: {node.budget_limit_tokens.toLocaleString()}</div>
                                  <div>Retries Allowed: {node.retry_attempts}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Standard Flow (4 nodes: parallel branches -> write -> verify)
                        <div className="flex flex-col md:flex-row items-center justify-between w-full h-full gap-8 relative">
                          
                          {/* Column 1: Parallel Research Nodes */}
                          <div className="flex flex-col gap-6 z-10">
                            {compiledGraph.nodes.filter(n => n.id.startsWith('research_')).map(node => {
                              const state = getNodeState(node.id);
                              return (
                                <div key={node.id} className={`node-card ${state}`}>
                                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{node.id}</span>
                                    <span className={`badge badge-${state} text-[8px] py-0`}>{state}</span>
                                  </div>
                                  <h3 className="text-xs font-bold text-white mb-1.5">{node.label}</h3>
                                  <div className="flex flex-col gap-0.5 text-[9px] text-gray-400 font-mono">
                                    <div>Type: Parallel</div>
                                    <div>Retries: {node.retry_attempts}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* SVG Links Column 1 -> 2 */}
                          <div className="hidden md:block absolute left-[38%] top-[25%] text-gray-700 pointer-events-none w-16">
                            <ArrowRight className="text-gray-700 w-6 h-6 animate-pulse" />
                          </div>

                          {/* Column 2: Join & Draft Writing */}
                          <div className="z-10">
                            {compiledGraph.nodes.filter(n => n.id === 'write_draft').map(node => {
                              const state = getNodeState(node.id);
                              return (
                                <div key={node.id} className={`node-card ${state}`}>
                                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{node.id}</span>
                                    <span className={`badge badge-${state} text-[8px] py-0`}>{state}</span>
                                  </div>
                                  <h3 className="text-xs font-bold text-white mb-1.5">{node.label}</h3>
                                  <div className="flex flex-col gap-0.5 text-[9px] text-gray-400 font-mono">
                                    <div>Type: Sequential</div>
                                    <div>Lineage: A + B</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* SVG Links Column 2 -> 3 */}
                          <div className="hidden md:block absolute right-[35%] top-[50%] text-gray-700 pointer-events-none w-16">
                            <ArrowRight className="text-gray-700 w-6 h-6" />
                          </div>

                          {/* Column 3: Quality Verification / Human review */}
                          <div className="z-10">
                            {compiledGraph.nodes.filter(n => n.id === 'verify_and_approve').map(node => {
                              const state = getNodeState(node.id);
                              return (
                                <div key={node.id} className={`node-card ${state}`}>
                                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{node.id}</span>
                                    <span className={`badge badge-${state} text-[8px] py-0`}>{state}</span>
                                  </div>
                                  <h3 className="text-xs font-bold text-white mb-1.5">{node.label}</h3>
                                  <div className="flex flex-col gap-0.5 text-[9px] text-gray-400 font-mono">
                                    <div>Type: Human Gate</div>
                                    <div>State: {state}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard Ledger Stats (Cost, latency) */}
                {runDetails && (
                  <div className="grid grid-cols-3 gap-3 border border-gray-800 bg-gray-900/40 rounded-lg p-3 text-center mb-4">
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">Total Cost</div>
                      <div className="text-base font-bold font-mono text-emerald-400">${runDetails.total_cost.toFixed(5)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">Latency</div>
                      <div className="text-base font-bold font-mono text-cyan-400">{runDetails.total_latency_ms.toLocaleString()} ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-semibold uppercase">Execution Steps</div>
                      <div className="text-base font-bold font-mono text-white">{runDetails.events.filter(e => e.type === 'success' || e.type === 'fail' || e.type === 'retry' || e.type === 'blocked').length}</div>
                    </div>
                  </div>
                )}

                {/* Visual Controls */}
                <div className="flex gap-3">
                  <button 
                    className="btn-secondary flex-1 justify-center text-xs"
                    onClick={() => {
                      if (currentRunId) executeNextStep(currentRunId);
                    }}
                    disabled={!isGraphApproved || isAutoStepping || !currentRunId || ['success', 'failed', 'blocked', 'paused_review'].includes(runDetails?.status || '')}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Execute Step
                  </button>

                  <button 
                    className={`btn-primary flex-1 justify-center text-xs ${isAutoStepping ? 'bg-red-500 hover:bg-red-400 shadow-red-500/10' : ''}`}
                    onClick={() => {
                      if (!currentRunId) return;
                      if (isAutoStepping) {
                        stopAutoStep();
                      } else {
                        startAutoStep(currentRunId);
                      }
                    }}
                    disabled={!isGraphApproved || !currentRunId || (!isAutoStepping && ['success', 'failed', 'blocked', 'paused_review'].includes(runDetails?.status || ''))}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isAutoStepping ? 'animate-spin' : ''}`} />
                    {isAutoStepping ? 'Halt Engine' : 'Auto Step Graph'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Execution Log, Handoffs, Review Gate (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Human Review Approval Panel */}
              {runDetails && runDetails.status === 'paused_review' && (
                <div className="glass-panel p-5 border-amber-500/30 bg-amber-950/10 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2.5">
                    <UserCheck className="text-amber-500 w-4 h-4" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500">Human Verification Required</h2>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    The workflow has paused at <strong>verify_and_approve</strong>. Review the draft artifact output and click approve or request modifications.
                  </p>
                  
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[10px] text-gray-400">Review Feedback / Modification Request:</label>
                    <textarea
                      className="form-input text-xs h-16 resize-none border-amber-500/30 bg-gray-950"
                      value={humanFeedback}
                      onChange={(e) => setHumanFeedback(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button 
                      className="btn-secondary py-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10 justify-center"
                      onClick={() => handleHumanReviewSubmit(false)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Draft
                    </button>
                    <button 
                      className="btn-primary py-1.5 text-xs bg-emerald-500 hover:bg-emerald-400 text-black justify-center"
                      onClick={() => handleHumanReviewSubmit(true)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve & Resume
                    </button>
                  </div>
                </div>
              )}

              {/* Event Logs Panel */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2.5">
                  <Activity className="text-cyan-400 w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">Event Log Traces</h2>
                </div>

                <div className="console-log flex flex-col gap-2 text-[11px]">
                  {!runDetails || runDetails.events.length === 0 ? (
                    <div className="text-center text-gray-600 my-auto">Waiting for events...</div>
                  ) : (
                    runDetails.events.map((event, idx) => (
                      <div 
                        key={idx} 
                        className={`border-b border-gray-900 pb-1.5 cursor-pointer hover:bg-gray-900/50 p-1 rounded transition-colors ${
                          event.type === 'blocked' ? 'text-purple-400' :
                          event.type === 'fail' ? 'text-red-400' :
                          event.type === 'retry' ? 'text-amber-400' :
                          event.type === 'success' ? 'text-emerald-400' : 'text-gray-400'
                        }`}
                        onClick={() => setSelectedLogPayload(event)}
                      >
                        <div className="flex justify-between text-[9px] text-gray-500 font-mono mb-0.5">
                          <span>Node: {event.node_id}</span>
                          <span>{event.ts.split(' ')[1] || event.ts}</span>
                        </div>
                        <div className="font-semibold capitalize flex items-center gap-1">
                          {event.type === 'blocked' && <Shield className="w-3 h-3 text-purple-400" />}
                          {event.type === 'retry' && <RefreshCw className="w-3 h-3 text-amber-400" />}
                          {event.type === 'fail' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          {event.type}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {JSON.stringify(event.payload_json)}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>

              {/* Verified Artifacts Panel */}
              <div className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2.5">
                  <Database className="text-cyan-400 w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">Typed Artifact Store</h2>
                </div>

                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  {!runDetails || runDetails.artifacts.length === 0 ? (
                    <div className="text-center text-xs text-gray-600 py-4">No verified artifacts written yet.</div>
                  ) : (
                    runDetails.artifacts.map((art) => (
                      <div 
                        key={art.id} 
                        className="border border-gray-800 rounded p-2 bg-gray-950 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => setSelectedArtifact(art)}
                      >
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{art.node_id} output</div>
                          <div className="text-[9px] text-gray-500 font-mono">Schema: {art.schema_ref}</div>
                        </div>
                        <FileText className="text-cyan-400 w-4 h-4" />
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Trace & Replay Center */}
        {activeTab === 'runs' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Run Selection Panel (4 cols) */}
            <div className="md:col-span-4 glass-panel p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <ListRestart className="text-cyan-400 w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Select Run to Replay</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400">Choose run history:</label>
                  <select 
                    className="form-input text-xs"
                    value={selectedReplayRun}
                    onChange={(e) => setSelectedReplayRun(e.target.value)}
                  >
                    <option value="">-- Choose Run ID --</option>
                    {historicalRuns.map((run) => (
                      <option key={run.id} value={run.id}>
                        {run.id.slice(0, 8)} - {run.goal_text.slice(0, 30)}... ({run.status})
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  className="btn-primary w-full justify-center mt-2 bg-cyan-500 text-black hover:bg-cyan-400"
                  onClick={handleReplay}
                  disabled={!selectedReplayRun}
                >
                  <Play className="w-4 h-4" /> Replay Execution Config
                </button>
              </div>

              {replayDetails && (
                <div className="border border-emerald-500/20 bg-emerald-950/10 rounded-lg p-3.5 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 border-b border-emerald-500/10 pb-1.5 mb-1">
                    <CheckCircle className="text-emerald-400 w-4 h-4" />
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Replay Completed</h3>
                  </div>
                  <div className="text-xs text-gray-300 flex flex-col gap-1 font-mono">
                    <div>Original Run: <span className="text-white">{replayDetails.original_run_id.slice(0,8)}</span></div>
                    <div>Replayed Run: <span className="text-white">{replayDetails.replayed_run_id.slice(0,8)}</span></div>
                    <div>Final Status: <span className={`badge badge-${replayDetails.final_status}`}>{replayDetails.final_status}</span></div>
                    <div>Execution Steps: <span className="text-white">{replayDetails.steps_taken}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Comparison Dashboard Panel (8 cols) */}
            <div className="md:col-span-8 glass-panel p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <Layers className="text-cyan-400 w-4 h-4" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Determinism & Performance Audit Comparison</h2>
              </div>

              {!originalRunCompare || !replayedRunCompare ? (
                <div className="text-center p-12 text-gray-500">
                  <RefreshCw className="mx-auto text-gray-700 w-12 h-12 mb-3" />
                  <p className="text-xs">Choose a run from the history ledger on the left and trigger Replay to display comparisons.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  
                  {/* Ledger statistics comparison table */}
                  <table className="w-full text-left text-xs border border-gray-800 rounded overflow-hidden">
                    <thead className="bg-gray-900 text-gray-300">
                      <tr>
                        <th className="p-3 border-r border-gray-800">Metric</th>
                        <th className="p-3 border-r border-gray-800 text-cyan-400">Original Run ({originalRunCompare.run_id.slice(0, 8)})</th>
                        <th className="p-3 text-emerald-400">Replayed Run ({replayedRunCompare.run_id.slice(0, 8)})</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-950/40 text-gray-400 font-mono">
                      <tr className="border-b border-gray-900">
                        <td className="p-3 border-r border-gray-800 font-sans font-semibold text-white">Status</td>
                        <td className="p-3 border-r border-gray-800">
                          <span className={`badge badge-${originalRunCompare.status}`}>{originalRunCompare.status}</span>
                        </td>
                        <td className="p-3">
                          <span className={`badge badge-${replayedRunCompare.status}`}>{replayedRunCompare.status}</span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-900">
                        <td className="p-3 border-r border-gray-800 font-sans font-semibold text-white">Total Cost ($)</td>
                        <td className="p-3 border-r border-gray-800 text-cyan-400">${originalRunCompare.total_cost.toFixed(5)}</td>
                        <td className="p-3 text-emerald-400">${replayedRunCompare.total_cost.toFixed(5)}</td>
                      </tr>
                      <tr className="border-b border-gray-900">
                        <td className="p-3 border-r border-gray-800 font-sans font-semibold text-white">Latency (ms)</td>
                        <td className="p-3 border-r border-gray-800">{originalRunCompare.total_latency_ms.toLocaleString()} ms</td>
                        <td className="p-3">{replayedRunCompare.total_latency_ms.toLocaleString()} ms</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-gray-800 font-sans font-semibold text-white">Handoff Artifact Count</td>
                        <td className="p-3 border-r border-gray-800">{originalRunCompare.artifacts.length}</td>
                        <td className="p-3">{replayedRunCompare.artifacts.length}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Outputs Compare */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Original Artifact Draft</h3>
                      <div className="bg-gray-950 border border-gray-900 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto h-60 text-gray-400">
                        {originalRunCompare.artifacts.find(a => a.node_id === 'write_draft')?.payload_json?.draft || 
                          JSON.stringify(originalRunCompare.artifacts, null, 2)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Replayed Artifact Draft</h3>
                      <div className="bg-gray-950 border border-gray-900 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto h-60 text-gray-400">
                        {replayedRunCompare.artifacts.find(a => a.node_id === 'write_draft')?.payload_json?.draft || 
                          JSON.stringify(replayedRunCompare.artifacts, null, 2)}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Evaluation Harness */}
        {activeTab === 'eval' && (
          <div className="glass-panel p-6 flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="text-cyan-400 w-5 h-5" />
                <h2 className="text-base font-bold uppercase tracking-wider text-white">Orchestrator Benchmark & Evaluation</h2>
              </div>
              
              <button 
                className="btn-primary"
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
              >
                <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                {isEvaluating ? 'Executing Harness...' : 'Execute Evaluation Benchmarks'}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              The evaluation harness compares a direct **Single-Agent** configuration against the orchestrator's generated **Multi-Agent** workflow graph across a set of fixed, long-horizon tasks.
            </p>

            {evalResults.length === 0 ? (
              <div className="text-center p-12 text-gray-600 border border-dashed border-gray-800 rounded-lg">
                <Activity className="mx-auto w-12 h-12 text-gray-800 mb-3" />
                <p className="text-xs">Click "Execute Evaluation Benchmarks" above to run the automated comparison suite.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                
                {/* Results Table */}
                <table className="w-full text-left text-xs border border-gray-800 rounded overflow-hidden">
                  <thead className="bg-gray-900 text-gray-300">
                    <tr>
                      <th className="p-3 border-r border-gray-800">Task Scenario Goal</th>
                      <th className="p-3 border-r border-gray-800">Single Agent Baseline</th>
                      <th className="p-3">Multi-Agent Graph Orchestration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-950/40 text-gray-400 font-mono">
                    {evalResults.map((res, idx) => (
                      <tr key={idx} className="border-b border-gray-900 items-start">
                        <td className="p-3 border-r border-gray-800 font-sans font-semibold text-white max-w-xs">
                          {res.goal}
                        </td>
                        <td className="p-3 border-r border-gray-800 text-[11px]">
                          <div>Agents: <span className="text-white">{res.single_agent.agents}</span></div>
                          <div>Cost: <span className="text-cyan-400">${res.single_agent.cost.toFixed(5)}</span></div>
                          <div>Latency: <span className="text-white">{res.single_agent.latency_ms} ms</span></div>
                          <div className="text-[10px] text-gray-500 font-sans mt-1.5">{res.single_agent.notes}</div>
                        </td>
                        <td className="p-3 text-[11px]">
                          <div>Agents: <span className="text-white">{res.multi_agent.agents}</span></div>
                          <div>Cost: <span className="text-emerald-400">${res.multi_agent.cost.toFixed(5)}</span></div>
                          <div>Latency: <span className="text-white">{res.multi_agent.latency_ms} ms</span></div>
                          <div className="text-[10px] text-gray-500 font-sans mt-1.5">{res.multi_agent.notes}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Marginal Value Report Note */}
                <div className="border border-cyan-500/20 bg-cyan-950/10 rounded-lg p-4">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    Marginal Value Audit Report
                  </h3>
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {evalSummary}
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* Artifact View Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-6 z-50">
          <div className="glass-panel p-5 bg-gray-950 border border-gray-800 max-w-2xl w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Artifact Handoff Payload ({selectedArtifact.node_id})
              </h3>
              <button 
                className="text-xs text-gray-500 hover:text-white"
                onClick={() => setSelectedArtifact(null)}
              >
                [Close]
              </button>
            </div>
            
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-gray-500">Target Schema Reference:</span>
              <span className="font-mono text-cyan-400 bg-gray-900 py-1 px-2 rounded border border-gray-800 select-all">
                {selectedArtifact.schema_ref}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="text-gray-500">Validated payload:</span>
              <pre className="font-mono text-emerald-400 bg-gray-900 p-3 rounded border border-gray-800 overflow-auto max-h-96 select-all">
                {JSON.stringify(selectedArtifact.payload_json, null, 2)}
              </pre>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4" /> JSON Schema check verified successfully! Handoff authorized.
            </div>
          </div>
        </div>
      )}

      {/* Log Payload View Modal */}
      {selectedLogPayload && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-6 z-50">
          <div className="glass-panel p-5 bg-gray-950 border border-gray-800 max-w-2xl w-full flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Log Event Payload Details
              </h3>
              <button 
                className="text-xs text-gray-500 hover:text-white"
                onClick={() => setSelectedLogPayload(null)}
              >
                [Close]
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 font-mono">
              <div>Node ID: <span className="text-white">{selectedLogPayload.node_id}</span></div>
              <div>Event Type: <span className="text-white uppercase">{selectedLogPayload.type}</span></div>
              <div>Latency: <span className="text-white">{selectedLogPayload.latency_ms} ms</span></div>
              <div>Cost: <span className="text-emerald-400">${selectedLogPayload.cost.toFixed(5)}</span></div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="text-gray-500">Payload data:</span>
              <pre className="font-mono text-cyan-400 bg-gray-900 p-3 rounded border border-gray-800 overflow-auto max-h-96 select-all">
                {JSON.stringify(selectedLogPayload.payload_json, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
