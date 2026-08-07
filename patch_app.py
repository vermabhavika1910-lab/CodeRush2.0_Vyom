import re

def apply_patch():
    file_path = "frontend/src/App.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # 1. Imports
    import_block = """import { 
  Play, 
"""
    reactflow_imports = """import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 50,
      },
    };
    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

const CustomNode = ({ data }: any) => {
  const { node, state } = data;
  return (
    <div className={`node-card ${state} min-w-[200px] border border-gray-800 shadow-xl shadow-black/50`}>
      <Handle type="target" position={Position.Left} className="bg-gray-700 w-3 h-3 rounded-none border-0" />
      <div className="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
        <span className="text-[10px] font-mono text-cyan-400 font-semibold">{node.id}</span>
        <span className={`badge badge-${state} text-[8px] py-0`}>{state}</span>
      </div>
      <h3 className="text-xs font-bold text-white mb-1.5">{node.label}</h3>
      <div className="flex flex-col gap-0.5 text-[9px] text-gray-400 font-mono">
        <div>Type: {node.type}</div>
        <div>Budget: {node.budget_limit_tokens}</div>
      </div>
      <Handle type="source" position={Position.Right} className="bg-gray-700 w-3 h-3 rounded-none border-0" />
    </div>
  );
};
const nodeTypes = { custom: CustomNode };

import { 
  Play, """
    content = content.replace(import_block, reactflow_imports)

    # 2. Add ReactFlow state and effect inside App component
    state_block = """  // UI Panels State
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);"""
    
    rf_state = """  // UI Panels State
  const [rfNodes, setRfNodes] = useState<any[]>([]);
  const [rfEdges, setRfEdges] = useState<any[]>([]);

  useEffect(() => {
    if (compiledGraph) {
      const initialNodes = compiledGraph.nodes.map(n => ({
        id: n.id,
        type: 'custom',
        data: { node: n, state: getNodeState(n.id) },
        position: { x: 0, y: 0 }
      }));
      const initialEdges = compiledGraph.edges.map(e => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        animated: getNodeState(e.source) === 'running' || getNodeState(e.source) === 'retry',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4B5563' },
        style: { stroke: '#4B5563', strokeWidth: 2 }
      }));
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
      setRfNodes(layoutedNodes);
      setRfEdges(layoutedEdges);
    }
  }, [compiledGraph, runDetails]);

  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);"""
    content = content.replace(state_block, rf_state)
    
    # 3. Replace Render Block
    
    render_start = """<div className="relative w-full h-full flex flex-col md:flex-row items-center justify-around gap-6 p-4">"""
    
    # Use regex to find the block
    pattern = re.compile(re.escape(render_start) + r".*?" + re.escape("""</div>\n                    </div>\n                  )}"""), re.DOTALL)
    
    replacement_render = """<div className="w-full h-full relative" style={{ minHeight: '400px' }}>
                      <ReactFlow
                        nodes={rfNodes}
                        edges={rfEdges}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                        className="dark"
                      >
                        <Background color="#374151" gap={16} />
                        <Controls className="bg-gray-900 fill-white text-white border-gray-800" />
                      </ReactFlow>
                    </div>
                  )}"""
    
    content = pattern.sub(replacement_render, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Patch applied successfully.")

if __name__ == "__main__":
    apply_patch()
