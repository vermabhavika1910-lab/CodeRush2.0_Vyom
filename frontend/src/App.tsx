import { useState } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider, useToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { HomePage } from '@/components/HomePage';
import { WorkflowBuilder } from '@/components/WorkflowBuilder';
import { AgentInspector } from '@/components/AgentInspector';
import { ExecutionPanel } from '@/components/ExecutionPanel';
import { RunHistory } from '@/components/RunHistory';
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
  const [view, setView] = useState<'home' | 'history'>('home');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [execCollapsed, setExecCollapsed] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);

  const sidebar = useResizable(260, 220, 380, 'x');
  const inspector = useResizable(360, 300, 480, 'x');
  const execHeight = useResizable(280, 120, 500, 'y');

  const selectedAgent = (() => {
    if (!selectedNodeId) return null;
    const node = WORKFLOW_NODES.find((n) => n.id === selectedNodeId);
    if (!node?.agentId) return null;
    return AGENTS.find((a) => a.id === node.agentId) || null;
  })();

  const handleSelect = (id: string) => {
    setSelected(id);
    if (id === 'history') setView('history');
    else if (id === 'projects' || id === 'library' || id === 'add-work') {
      setView('home');
      push({ title: id === 'projects' ? 'Projects' : id === 'library' ? 'Agent Library' : 'New Work', message: 'Mock view loaded', variant: 'info' });
    } else {
      setView('home');
    }
  };

  const handleRun = async () => {
    try {
      push({ title: 'Compiling Workflow', message: 'Generating agent graph...', variant: 'info' });
      const graph = await api.compileGoal('Market Entry Brief', 'mock', '');
      await api.saveGraph(graph);
      
      const { run_id } = await api.createRun(graph.id, 'mock', '');
      setActiveRunId(run_id);
      
      setExecCollapsed(false);
      push({ title: 'Workflow running', message: `Run ${run_id} started.`, variant: 'success' });
      
      // We start polling steps
      let status = 'pending';
      while (status === 'pending' || status === 'running') {
        const res = await api.runStep(run_id);
        status = res.status;
        await new Promise(r => setTimeout(r, 1000));
      }
      push({ title: 'Run completed', message: `Status: ${status}`, variant: 'success' });
    } catch (err: any) {
      push({ title: 'Error', message: err.message, variant: 'error' });
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
        ) : workflowOpen ? (
          <div className="flex flex-1 min-w-0">
            <WorkflowBuilder
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => { setSelectedNodeId(id); if (id && showInspectorAsDrawer) setInspectorDrawerOpen(true); }}
              onClose={closeWorkflow}
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
          <HomePage onOpenWorkflow={openWorkflow} />
        )}
      </div>

      {view !== 'history' && (
        <>
          {!execCollapsed && <div className="resize-handle-y" onPointerDown={execHeight.onPointerDown} />}
          <ExecutionPanel
            collapsed={execCollapsed}
            onToggle={() => setExecCollapsed((c) => !c)}
            height={execCollapsed ? undefined : execHeight.size}
            activeRunId={activeRunId}
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
