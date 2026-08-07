import { useState, useRef } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider, useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { HomePage } from '@/components/HomePage';
import { WorkflowBuilder } from '@/components/WorkflowBuilder';
import { AgentInspector } from '@/components/AgentInspector';
import { ExecutionPanel } from '@/components/ExecutionPanel';
import { RunHistory } from '@/components/RunHistory';
import { EvaluationHarness } from '@/components/EvaluationHarness';
import { IntroAnimation } from '@/components/IntroAnimation';
import { LoginPage } from '@/components/LoginPage';
import { AGENTS, WORKFLOW_NODES } from '@/data/mock';
import { useResizable, useMediaQuery } from '@/hooks/useResizable';
import { api } from '@/services/api';

function MaestroShell() {
  const { push } = useToast();
  const [loggedIn, setLoggedIn] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [selected, setSelected] = useState('researcher');
  const [view, setView] = useState<'home' | 'history' | 'eval'>('home');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [execCollapsed, setExecCollapsed] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulatedSteps, setSimulatedSteps] = useState<any[] | undefined>(undefined);
  const [simulatedArtifacts, setSimulatedArtifacts] = useState<any[] | undefined>(undefined);
  const [nodeStates, setNodeStates] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const cancelRef = useRef(false);

  const handleStopOrchestration = () => {
    cancelRef.current = true;
    setIsRunning(false);
    setWorkflowOpen(false); // Return UI to pre-run state (HomePage)
    // Note: Clear simulated states too
    setSimulatedSteps(undefined);
    setSimulatedArtifacts(undefined);
    setNodeStates({});
  };


  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);

  const sidebar = useResizable(260, 220, 380, 'x', false);
  const inspector = useResizable(360, 300, 480, 'x', true);
  const execHeight = useResizable(280, 120, 500, 'y', true);

  const selectedAgent = (() => {
    if (!selectedNodeId) return null;
    const node = WORKFLOW_NODES.find((n) => n.id === selectedNodeId);
    if (!node?.agentId) return null;
    return AGENTS.find((a) => a.id === node.agentId) || null;
  })();

  const handleSelect = (id: string) => {
    setSelected(id);
    if (id === 'history') {
      setView('history');
    } else if (id === 'eval') {
      setView('eval');
    } else if (id === 'projects' || id === 'library' || id === 'add-work') {
      setView('home');
      push({ title: id === 'projects' ? 'Projects' : id === 'library' ? 'Agent Library' : 'New Work', message: 'Mock view loaded', variant: 'info' });
    } else {
      setView('home');
      const agentToNodeMap: Record<string, string> = {
        researcher: 'research',
        analyst: 'analyst-a',
        verifier: 'verifier',
        summarizer: 'report',
      };
      const nodeId = agentToNodeMap[id];
      if (nodeId) {
        setWorkflowOpen(true);
        setSelectedNodeId(nodeId);
        if (isTablet) {
          setInspectorDrawerOpen(true);
        }
      }
    }
  };

  const runLocalSimulation = async (goalText: string) => {
    cancelRef.current = false;
    setIsRunning(true);
    setCurrentPrompt(goalText);
    setIsSimulationMode(true);
    setExecCollapsed(false);
    setWorkflowOpen(true); // Open the canvas so the user can see the graph nodes!

    // Dynamic Mock Generators
    const generateMockFindings = (prompt: string, index: number) => {
      const cleanPrompt = prompt.trim();
      const isSecurity = cleanPrompt.toLowerCase().includes('adversarial') || 
                         cleanPrompt.toLowerCase().includes('security') || 
                         cleanPrompt.toLowerCase().includes('hack');
                         
      if (isSecurity) {
        return index === 1 
          ? [
              "Vulnerability scan completed on target application endpoints.",
              "Identified potential SQL Injection (SQLi) hazard inside authentication routers.",
              "Sensitive environment variables found exposed without secure vault storage."
            ]
          : [
              "Dependency inspector flagged 3 critical-risk vulnerable node_modules packages.",
              "Wildcard CORS origin rules found configured in API response headers.",
              "Unprotected administrators console path identified on server root."
            ];
      }

      if (cleanPrompt.toLowerCase().includes('speech') || cleanPrompt.toLowerCase().includes('text') || cleanPrompt.toLowerCase().includes('helper')) {
        return index === 1 
          ? [
              "Streaming Audio Layer: WebRTC connection established with 100ms chunking intervals.",
              "Speech-to-Text Pipeline: Dual-route processing using Whisper API (primary) and Gemini Live (fallback).",
              "Latency Constraints: Average latency verified at 240ms under heavy socket loads."
            ]
          : [
              "Semantic Validation: Text chunk embeddings compared against compliance guidelines.",
              "Security Encryption: Audio streams encrypted in transit via WebSockets Secure (WSS).",
              "Database Handoff: Transcripts logged directly to SQLite database for audit trails."
            ];
      }
      
      const keywords = cleanPrompt.split(/\s+/).filter(w => w.length > 4 && !['about', 'write', 'draft', 'create', 'verify', 'check', 'report'].includes(w.toLowerCase())).slice(0, 3);
      const topic = keywords.join(' ') || 'requested project task';
      
      if (index === 1) {
        return [
          `Primary research gathered comprehensive data points relating to ${topic}.`,
          `High growth prospects and strong initial market demand indicators verified.`,
          `Competitive analysis maps out key active implementation barriers regarding ${topic}.`
        ];
      } else {
        return [
          `Secondary literature review evaluates resource constraints for ${topic}.`,
          `Initial cost modeling projects solid efficiency improvements and cost reductions.`,
          `Industry early-adopters display positive strategic alignment toward implementing ${topic}.`
        ];
      }
    };

    const generateMockDraft = (prompt: string) => {
      const cleanPrompt = prompt.trim();
      const isSecurity = cleanPrompt.toLowerCase().includes('adversarial') || 
                         cleanPrompt.toLowerCase().includes('security') || 
                         cleanPrompt.toLowerCase().includes('hack');
                         
      if (isSecurity) {
        return `# Security Audit Report\n\n## Vulnerability Findings\n- SQL Injection risk on user registration endpoint.\n- Insecure storage of client environment secrets.\n\n## Recommendations\nImmediately implement parameterized queries and migrate secrets to a secure Vault.`;
      }

      if (cleanPrompt.toLowerCase().includes('speech') || cleanPrompt.toLowerCase().includes('text') || cleanPrompt.toLowerCase().includes('helper')) {
        return `# System Architecture & Roadmap: Speech-to-Text Helper\n\n` +
               `## 1. System Architecture\n` +
               `- **Ingress**: User Microphone → Web Audio API Browser Stream → WebSockets Secure (WSS).\n` +
               `- **Processing**: WebSocket Server Node.js → Fast Chunking → Whisper API / Deepgram Core.\n` +
               `- **Guardrail**: Sentiment Analysis + PII Masking Filter.\n` +
               `- **Egress**: Live Text Broadcast to Support Console iframe Widget.\n\n` +
               `## 2. Functional Implementation Roadmap\n` +
               `- **Milestone 1 (Weeks 1-2)**: Real-time WebRTC audio recording and chunk streaming setup.\n` +
               `- **Milestone 2 (Weeks 3-4)**: Transcript compilation, PII masking, and latency optimizations.\n` +
               `- **Milestone 3 (Weeks 5-6)**: Support portal widget embedding, unit testing, and production deployment.`;
      }
      
      const keywords = cleanPrompt.split(/\s+/).filter(w => w.length > 4 && !['about', 'write', 'draft', 'create', 'verify', 'check', 'report'].includes(w.toLowerCase())).slice(0, 3);
      const topic = keywords.join(' ') || 'requested project task';
      
      return `# Strategy & Implementation Report: ${topic.toUpperCase()}\n\n## Executive Summary\n- Solid technical foundation built on top of user requirements.\n- High strategic relevance in the current market landscape.\n\n## Strategic Roadmap\nWe recommend dedicating the next phase to refining the core features and scaling the architecture for ${topic}.`;
    };
    
    const isAdversarial = goalText.toLowerCase().includes('adversarial') || 
                         goalText.toLowerCase().includes('security') || 
                         goalText.toLowerCase().includes('hack');
                         
    const nodes = isAdversarial ? [
      { id: 'trigger_node', agent: 'Intruder/Security Tester' },
      { id: 'monitor_node', agent: 'Quality Verifier' }
    ] : [
      { id: 'research_topic_a', agent: 'Research Specialist' },
      { id: 'research_topic_b', agent: 'Research Specialist' },
      { id: 'write_draft', agent: 'Content Writer' },
      { id: 'verify_and_approve', agent: 'Quality Verifier' }
    ];

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const delay = async (ms: number) => {
      await sleep(ms);
      if (cancelRef.current) throw new Error('cancelled');
    };
    
    try {
      // Step 1: Initialize all to pending
      let simSteps = nodes.map(n => ({
        nodeId: n.id,
        agent: n.agent,
        status: 'pending',
        latency: 0,
        tokens: 0,
        cost: 0,
        retries: 0
      }));
      
      const initialStates: Record<string, string> = {};
      nodes.forEach(n => { initialStates[n.id] = 'pending'; });
      setNodeStates(initialStates);
      setSimulatedSteps(simSteps);
      setSimulatedArtifacts([]);
      await delay(1000);
      
      if (isAdversarial) {
        // 1. Run trigger node
        simSteps = simSteps.map(s => s.nodeId === 'trigger_node' ? { ...s, status: 'running' } : s);
        setSimulatedSteps([...simSteps]);
        setNodeStates({ ...initialStates, trigger_node: 'running' });
        await delay(1500);
        
        // 2. Block/Fail trigger node
        simSteps = simSteps.map(s => s.nodeId === 'trigger_node' ? { ...s, status: 'failure', cost: 0.001, latency: 1200, tokens: 600 } : s);
        setSimulatedSteps([...simSteps]);
        setNodeStates({ ...initialStates, trigger_node: 'failure' });
        
        const blockedArt = [
          {
            id: 'art_blocked_1',
            node_id: 'trigger_node',
            schema_ref: 'security/blocked_event',
            payload_json: {
              error: "SECURITY BREACH BLOCKED: Agent attempted to invoke un-whitelisted tool 'delete_system_logs'. Blocked event logged to 'events' table."
            }
          }
        ];
        setSimulatedArtifacts(blockedArt);
        push({ title: 'Adversarial Blocked', message: "Agent attempted un-whitelisted tool 'delete_system_logs'. Blocked event logged to SQLite.", variant: 'error' });
        await delay(1000);
        
        // 3. Mark run blocked/failed
        push({ title: 'Run halted', message: 'Status: BLOCKED', variant: 'error' });
        setExecCollapsed(false);
        execHeight.setSize(Math.min(380, Math.floor(window.innerHeight * 0.45)));
      } else {
        const activeStates = { ...initialStates };
        
        // 1. Run research A & B in parallel
        simSteps = simSteps.map(s => ['research_topic_a', 'research_topic_b'].includes(s.nodeId) ? { ...s, status: 'running' } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['research_topic_a'] = 'running';
        activeStates['research_topic_b'] = 'running';
        setNodeStates({ ...activeStates });
        await delay(1800);
        
        // 2. A succeeds, B fails and triggers retry backoff
        simSteps = simSteps.map(s => {
          if (s.nodeId === 'research_topic_a') return { ...s, status: 'success', cost: 0.001, latency: 1500, tokens: 900 };
          if (s.nodeId === 'research_topic_b') return { ...s, status: 'retry' };
          return s;
        });
        setSimulatedSteps([...simSteps]);
        activeStates['research_topic_a'] = 'success';
        activeStates['research_topic_b'] = 'retry';
        setNodeStates({ ...activeStates });
        
        const findingsArtA = [
          {
            id: 'art_a',
            node_id: 'research_topic_a',
            schema_ref: 'agents/research_agent/output_schema',
            payload_json: {
              findings: generateMockFindings(goalText, 1)
            }
          }
        ];
        setSimulatedArtifacts(findingsArtA);
        push({ title: 'Handoff Failure on Topic B', message: 'API connection timed out. Retrying with exponential backoff...', variant: 'info' });
        await delay(2000);
        
        // 3. B succeeds on retry
        simSteps = simSteps.map(s => s.nodeId === 'research_topic_b' ? { ...s, status: 'success', cost: 0.001, latency: 1200, tokens: 750, retries: 1 } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['research_topic_b'] = 'success';
        setNodeStates({ ...activeStates });
        
        const findingsArtB = [
          ...findingsArtA,
          {
            id: 'art_b',
            node_id: 'research_topic_b',
            schema_ref: 'agents/research_agent/output_schema',
            payload_json: {
              findings: generateMockFindings(goalText, 2)
            }
          }
        ];
        setSimulatedArtifacts(findingsArtB);
        push({ title: 'Topic B Success', message: 'Retry attempt succeeded.', variant: 'success' });
        await delay(1200);
        
        // 4. Run write draft
        simSteps = simSteps.map(s => s.nodeId === 'write_draft' ? { ...s, status: 'running' } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['write_draft'] = 'running';
        setNodeStates({ ...activeStates });
        await delay(2200);
        
        simSteps = simSteps.map(s => s.nodeId === 'write_draft' ? { ...s, status: 'success', cost: 0.003, latency: 2500, tokens: 1950 } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['write_draft'] = 'success';
        setNodeStates({ ...activeStates });
        
        const draftArt = [
          ...findingsArtB,
          {
            id: 'art_draft',
            node_id: 'write_draft',
            schema_ref: 'agents/writer_agent/output_schema',
            payload_json: {
              draft: generateMockDraft(goalText)
            }
          }
        ];
        setSimulatedArtifacts(draftArt);
        await delay(1000);
        
        // 5. Run human review gate
        simSteps = simSteps.map(s => s.nodeId === 'verify_and_approve' ? { ...s, status: 'running' } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['verify_and_approve'] = 'running';
        setNodeStates({ ...activeStates });
        push({ title: 'Human Review Gate', message: 'Workflow paused at verify_and_approve. Please approve the draft.', variant: 'info' });
        await delay(3500);
        
        // 6. Auto-approve
        simSteps = simSteps.map(s => s.nodeId === 'verify_and_approve' ? { ...s, status: 'success', cost: 0.001, latency: 450, tokens: 150 } : s);
        setSimulatedSteps([...simSteps]);
        activeStates['verify_and_approve'] = 'success';
        setNodeStates({ ...activeStates });
        
        const finalArt = [
          ...draftArt,
          {
            id: 'art_approval',
            node_id: 'verify_and_approve',
            schema_ref: 'manual_approval',
            payload_json: { approved: true, feedback: "Automated verification checks passed successfully." }
          }
        ];
        setSimulatedArtifacts(finalArt);
        push({ title: 'Workflow Complete', message: 'Status: SUCCESS', variant: 'success' });
        setExecCollapsed(false);
        execHeight.setSize(Math.min(380, Math.floor(window.innerHeight * 0.45)));
      }
    } catch (err: any) {
      if (err.message === 'cancelled') {
        console.log('Local simulation execution cancelled');
      } else {
        throw err;
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = async (promptGoal?: string) => {
    const targetGoal = typeof promptGoal === 'string' && promptGoal.trim() ? promptGoal : 'Market Entry Brief';
    cancelRef.current = false;
    setIsRunning(true);
    setCurrentPrompt(targetGoal);
    setIsSimulationMode(false);
    setSimulatedSteps(undefined);
    setSimulatedArtifacts(undefined);
    setNodeStates({});
    setWorkflowOpen(true);
    
    try {
      push({ title: 'Executing Workflow', message: `Sending goal: "${targetGoal.slice(0, 35)}..."`, variant: 'info' });
      
      const templates = await api.getTemplates();
      if (!templates || templates.length === 0) throw new Error("No templates available");
      const graph = templates[0].graph;

      if (cancelRef.current) return;
      
      setExecCollapsed(false);
      push({ title: 'Workflow started', message: `Creating run execution...`, variant: 'success' });
      
      // Step 1: Create stateful run on backend
      const { run_id } = await api.createRun(graph, targetGoal);
      setActiveRunId(run_id);
      
      let runState = await api.getRunStatus(run_id);
      
      // Step 2: Poll steps dynamically
      while (runState.status === 'pending' || runState.status === 'running') {
        if (cancelRef.current) break;
        
        // Execute the next step
        runState = await api.runStep(run_id);
        
        const steps = runState.step_results || [];
        const newSteps: any[] = [];
        const states: Record<string, string> = {};

        steps.forEach((step: any) => {
          const nodeId = step.node_id;
          const status = step.status === 'completed' ? 'success' : step.status === 'failed' ? 'failure' : step.status;
          states[nodeId] = status;
          newSteps.push({
            nodeId,
            agent: step.node_label,
            status,
            latency: step.execution_time_ms,
            tokens: step.details?.tokens || 0,
            cost: step.details?.cost || 0,
            retries: step.details?.retries || 0
          });
        });

        // Set the active node (next up in queue) to running for UX
        if (runState.status === 'running' && runState.queue && runState.queue.length > 0) {
          const nextNodeId = runState.queue[0];
          states[nextNodeId] = 'running';
        }

        setNodeStates(states);
        setSimulatedSteps(newSteps);
        
        // Map outputs as artifacts
        const artifactsList: any[] = [];
        Object.keys(runState.outputs || {}).forEach((nid) => {
          artifactsList.push({
            id: `art_${run_id}_${nid}`,
            node_id: nid,
            schema_ref: 'schema',
            payload_json: runState.outputs[nid]
          });
        });
        setSimulatedArtifacts(artifactsList);

        // Sleep briefly between steps for visual progression
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (runState.status === 'completed') {
        push({ title: 'Run completed', message: 'Workflow finished successfully.', variant: 'success' });
      } else if (runState.status === 'blocked') {
        push({ title: 'Run Blocked', message: 'Security violation blocked.', variant: 'error' });
      } else {
        push({ title: 'Run Failed', message: 'Workflow execution failed.', variant: 'error' });
      }
      
      setExecCollapsed(false);
      execHeight.setSize(Math.min(380, Math.floor(window.innerHeight * 0.45)));
      
    } catch (err: any) {
      if (cancelRef.current) {
        console.log('API run execution cancelled');
      } else {
        console.warn('Backend connection error. Switching to Browser Simulation Fallback.', err);
        push({ title: 'Connection Offline', message: 'Cannot reach backend server. Switched to offline simulation mode.', variant: 'warning' });
        runLocalSimulation(targetGoal);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const openWorkflow = () => {
    setWorkflowOpen(true);
    setSelectedNodeId('research');
  };

  const closeWorkflow = () => {
    setWorkflowOpen(false);
    setSelectedNodeId(null);
  };

  if (!loggedIn) {
    return (
      <ThemeProvider>
        <ToastProvider>
          {introDone ? (
            <LoginPage onLogin={() => { setLoggedIn(true); push({ title: 'Welcome to Maestro', message: 'Orchestration ready.', variant: 'success' }); }} />
          ) : (
            <IntroAnimation onDone={() => setIntroDone(true)} />
          )}
        </ToastProvider>
      </ThemeProvider>
    );
  }

  const showSidebarAsDrawer = isTablet;
  const showInspectorAsDrawer = isTablet;

  return (
    <div className="maestro-app-reveal flex h-screen w-screen flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <TopBar
        workflowName="Market Entry Brief"
        version="v1.0.0"
        onRun={handleRun}
        onToggleWorkflow={() => { if (workflowOpen) closeWorkflow(); else openWorkflow(); }}
        workflowOpen={workflowOpen}
        onOpenMobileSidebar={showSidebarAsDrawer ? () => setSidebarDrawerOpen(true) : undefined}
        isRunning={isRunning}
        onStopOrchestration={handleStopOrchestration}
      />
      <div className="flex flex-1 min-h-0">
        {showSidebarAsDrawer ? (
          <Sidebar
            selected={selected}
            onSelect={handleSelect}
            drawer
            drawerOpen={sidebarDrawerOpen}
            onCloseDrawer={() => setSidebarDrawerOpen(false)}
          />
        ) : (
          <>
            <Sidebar selected={selected} onSelect={handleSelect} width={sidebar.size} />
            <div className="resize-handle-x" onPointerDown={sidebar.onPointerDown} />
          </>
        )}

        {view === 'history' ? (
          <RunHistory />
        ) : view === 'eval' ? (
          <EvaluationHarness />
        ) : workflowOpen ? (
          <div className="flex flex-1 min-w-0">
            <WorkflowBuilder
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => { setSelectedNodeId(id); if (id && showInspectorAsDrawer) setInspectorDrawerOpen(true); }}
              onClose={closeWorkflow}
              nodeStates={nodeStates}
            />
            {showInspectorAsDrawer ? (
              <AgentInspector
                agent={selectedAgent}
                onClose={() => setSelectedNodeId(null)}
                drawer
                drawerOpen={inspectorDrawerOpen}
                onCloseDrawer={() => setInspectorDrawerOpen(false)}
              />
            ) : (
              <>
                <div className="resize-handle-x" onPointerDown={inspector.onPointerDown} />
                <AgentInspector
                  agent={selectedAgent}
                  onClose={() => setSelectedNodeId(null)}
                  width={inspector.size}
                />
              </>
            )}
          </div>
        ) : (
          <HomePage 
            onOpenWorkflow={openWorkflow} 
            onSubmitPrompt={handleRun} 
            isRunning={isRunning}
            currentPrompt={currentPrompt}
            onStopOrchestration={handleStopOrchestration}
          />
        )}
      </div>

      {view !== 'history' && view !== 'eval' && (
        <>
          {!execCollapsed && <div className="resize-handle-y" onPointerDown={execHeight.onPointerDown} />}
          <ExecutionPanel
            collapsed={execCollapsed}
            onToggle={() => {
              if (execCollapsed) {
                execHeight.setSize(Math.min(380, Math.floor(window.innerHeight * 0.45)));
              }
              setExecCollapsed((c) => !c);
            }}
            height={execCollapsed ? undefined : execHeight.size}
            activeRunId={activeRunId}
            simulatedSteps={simulatedSteps}
            simulatedArtifacts={simulatedArtifacts}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MaestroShell />
      </ToastProvider>
    </ThemeProvider>
  );
}
