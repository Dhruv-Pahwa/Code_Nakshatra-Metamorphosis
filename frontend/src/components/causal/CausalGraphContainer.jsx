import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Custom node types ──────────────────────────────────────
const baseNode = 'bg-bg-card border border-border rounded-lg px-4 py-3 shadow-card text-center min-w-[140px]';

const InstrumentNode = ({ data }) => (
  <div className={`${baseNode} border-border-strong`}>
    <Handle type="source" position={Position.Right} className="!bg-border-strong !border-0 !w-2 !h-2" />
    <Handle type="target" position={Position.Left} className="!bg-border-strong !border-0 !w-2 !h-2" />
    <p className="label text-[9px] mb-1">{data.sublabel}</p>
    <p className="text-sm font-semibold text-text-primary">{data.label}</p>
  </div>
);

const VariableNode = ({ data }) => (
  <div className={baseNode}>
    <Handle type="source" position={Position.Right} className="!bg-border-strong !border-0 !w-2 !h-2" />
    <Handle type="target" position={Position.Left} className="!bg-border-strong !border-0 !w-2 !h-2" />
    <p className="label text-[9px] mb-1">{data.sublabel}</p>
    <p className="text-sm font-semibold text-text-primary">{data.label}</p>
  </div>
);

const ActiveChoiceNode = ({ data }) => (
  <div className={`${baseNode} border-text-primary`}>
    <Handle type="source" position={Position.Right} className="!bg-text-primary !border-0 !w-2 !h-2" />
    <Handle type="target" position={Position.Left} className="!bg-text-primary !border-0 !w-2 !h-2" />
    <p className="label text-[9px] mb-1">{data.sublabel}</p>
    <p className="text-sm font-bold text-text-primary">{data.label}</p>
  </div>
);

const MultiplierNode = ({ data }) => (
  <div className={`${baseNode} bg-bg-card`}>
    <Handle type="source" position={Position.Right} className="!bg-text-muted !border-0 !w-2 !h-2" />
    <Handle type="target" position={Position.Left} className="!bg-text-muted !border-0 !w-2 !h-2" />
    <p className="label text-[9px] mb-1">{data.sublabel}</p>
    <p className="text-sm font-bold text-text-primary">{data.label}</p>
  </div>
);

const nodeTypes = {
  instrument: InstrumentNode,
  variable: VariableNode,
  activeChoice: ActiveChoiceNode,
  multiplier: MultiplierNode,
};

const autoLayoutNodes = (nodeList = [], edgeList = []) => {
  if (!nodeList.length) return [];
  const indegree = Object.fromEntries(nodeList.map((node) => [node.id, 0]));
  const outgoing = Object.fromEntries(nodeList.map((node) => [node.id, []]));

  edgeList.forEach((edge) => {
    if (indegree[edge.target] != null) indegree[edge.target] += 1;
    if (outgoing[edge.source]) outgoing[edge.source].push(edge.target);
  });

  const queue = nodeList.filter((node) => indegree[node.id] === 0).map((node) => node.id);
  const levelById = {};
  queue.forEach((id) => { levelById[id] = 0; });

  while (queue.length > 0) {
    const current = queue.shift();
    const nextLevel = (levelById[current] || 0) + 1;
    (outgoing[current] || []).forEach((target) => {
      indegree[target] -= 1;
      levelById[target] = Math.max(levelById[target] || 0, nextLevel);
      if (indegree[target] === 0) queue.push(target);
    });
  }

  const levels = {};
  nodeList.forEach((node) => {
    const level = levelById[node.id] || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });

  return Object.keys(levels).flatMap((levelKey) => {
    const level = Number(levelKey);
    return levels[level].map((node, index) => ({
      ...node,
      position: {
        x: 120 + (level * 240),
        y: 80 + (index * 140),
      },
    }));
  });
};

// ── Edge styling helpers ───────────────────────────────────
const magnitudeStrokeWidth = (magnitude) => {
  if (!magnitude) return 1.5;
  const m = String(magnitude).toLowerCase();
  if (m === 'high') return 2.5;
  if (m === 'medium') return 1.8;
  return 1.2; // low
};

const magnitudeColor = (magnitude) => {
  if (!magnitude) return 'var(--accent-primary)';
  const m = String(magnitude).toLowerCase();
  if (m === 'high') return 'var(--accent-negative)';
  if (m === 'medium') return 'var(--accent-primary)';
  return 'var(--text-muted)'; // low
};

// ── Phase 6: Confidence overlay legend ────────────────────
const ConfidenceLegend = ({ edges }) => {
  const highCount = edges.filter((e) => String(e.confidence || '').toLowerCase() === 'high').length;
  const medCount = edges.filter((e) => String(e.confidence || '').toLowerCase() === 'medium').length;
  const lowCount = edges.filter((e) => String(e.confidence || '').toLowerCase() === 'low').length;

  return (
    <div className="absolute top-4 right-4 bg-bg-card border border-border rounded px-3 py-2 text-[9px] tracking-widest uppercase space-y-1 z-10">
      <p className="font-semibold text-text-muted mb-1">CONFIDENCE</p>
      {highCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 rounded" style={{ backgroundColor: 'var(--accent-negative)', height: '2.5px' }} />
          <span className="text-accent-positive">High ({highCount})</span>
        </div>
      )}
      {medCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 rounded" style={{ backgroundColor: 'var(--accent-primary)', height: '1.8px' }} />
          <span className="text-text-primary">Medium ({medCount})</span>
        </div>
      )}
      {lowCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-5 h-0.5 rounded" style={{ backgroundColor: 'var(--text-muted)', height: '1.2px' }} />
          <span className="text-text-muted">Low ({lowCount})</span>
        </div>
      )}
    </div>
  );
};

// ── Default edge options ───────────────────────────────────
const defaultEdgeOptions = {
  style: { stroke: 'var(--accent-primary)', strokeWidth: 1.5 },
};

const mapEdges = (edgeList = []) => (
  edgeList.map((e) => {
      // Phase 6: build edge label from label + confidence badge
      const magnitude = e.magnitude || '';
      const confidence = e.confidence || '';
      const rawLabel = e.label || magnitude;
      const confSuffix = confidence ? ` [${confidence}]` : '';
      const composedLabel = rawLabel ? `${rawLabel}${confSuffix}` : confSuffix || undefined;

      return {
        ...e,
        label: composedLabel,
        labelStyle: {
          fill: `var(--text-primary)`,
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: { fill: 'var(--bg-card)', fillOpacity: 0.9 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        style: e.type === 'latent'
          ? { stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '5,4' }
          : { stroke: magnitudeColor(magnitude), strokeWidth: magnitudeStrokeWidth(magnitude) },
        animated: e.type === 'latent',
      };
    })
);

const CausalGraphContainer = ({ nodes: initNodes, edges: initEdges, onNodeClick }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mapEdges(initEdges));

  useEffect(() => {
    setNodes(autoLayoutNodes(initNodes || [], initEdges || []));
  }, [initEdges, initNodes, setNodes]);

  useEffect(() => {
    setEdges(mapEdges(initEdges || []));
  }, [initEdges, setEdges]);

  const handleNodeClick = useCallback((_, node) => {
    onNodeClick && onNodeClick(node);
  }, [onNodeClick]);

  // Track confidence distribution for legend
  const rawEdges = initEdges || [];

  return (
    <div style={{ height: '520px' }} className="border border-border rounded-lg overflow-hidden bg-bg-main relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border-default)" gap={24} size={1} />
        <Controls showInteractive={false} className="!shadow-card !border-border" />
      </ReactFlow>

      {/* Phase 6: Confidence badge overlay (top-right) */}
      <ConfidenceLegend edges={rawEdges} />

      {/* Phase 6: Enhanced legend (bottom-left) */}
      <div className="absolute bottom-4 left-4 flex items-center gap-6 bg-bg-card border border-border rounded px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-px" style={{ backgroundColor: 'var(--accent-negative)', height: '2.5px' }} />
          <span className="label text-[9px]">HIGH IMPACT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px" style={{ backgroundColor: 'var(--accent-primary)', height: '1.8px' }} />
          <span className="label text-[9px]">MEDIUM IMPACT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px" style={{ backgroundColor: 'var(--text-muted)', height: '1.2px' }} />
          <span className="label text-[9px]">LOW IMPACT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-px" style={{ backgroundColor: 'var(--border-strong)', borderTop: '1.5px dashed var(--text-muted)' }} />
          <span className="label text-[9px]">LATENT</span>
        </div>
      </div>
    </div>
  );
};

export default CausalGraphContainer;
