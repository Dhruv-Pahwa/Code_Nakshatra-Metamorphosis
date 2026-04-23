import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const ObsidianGraph = ({ nodesData, edgesData, onNodeClick }) => {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    // Map data for ForceGraph
    const mappedNodes = nodesData.map((node) => ({
      id: node.id,
      val: 2, // Size metric
      name: node.data?.label || node.id,
      color: '#10b981', // green theme color
    }));

    const mappedLinks = edgesData.map((edge) => ({
      source: edge.source,
      target: edge.target,
      color: 'rgba(148, 163, 184, 0.4)', // transparent line
    }));

    setGraphData({ nodes: mappedNodes, links: mappedLinks });
  }, [nodesData, edgesData]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-bg-main relative cursor-crosshair">
      <p className="absolute top-4 left-4 z-10 label-muted">OBSIDIAN NETWORK VISUALIZATION</p>
      
      {graphData.nodes.length > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node) => 'var(--accent-primary, #10b981)'}
          nodeRelSize={6}
          linkColor={(link) => 'var(--border-default, #334155)'}
          linkWidth={2}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.01}
          d3Force="charge"
          d3VelocityDecay={0.4}
          onNodeClick={(node) => {
             // to match the expected format for parent selection
             // which expects the original node from CausalExplorer
             const parentNode = nodesData.find(n => n.id === node.id);
             if (parentNode && onNodeClick) {
                 onNodeClick(parentNode);
             }
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12/globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // dark background like obsidian nodes
            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#cbd5e1'; // light text
            ctx.fillText(label, node.x, node.y + 10);
          }}
        />
      )}
    </div>
  );
};

export default ObsidianGraph;
