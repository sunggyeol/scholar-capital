'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, GraphNode, GraphLink } from '@/lib/types/graph';
import { 
  LightBulbIcon, 
  CursorArrowRaysIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  ChartBarIcon,
  MapPinIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
}) as any;

interface ScholarGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  width?: number;
  height?: number;
}

export function ScholarGraph({ 
  data, 
  onNodeClick, 
  onNodeHover,
  width,
  height 
}: ScholarGraphProps) {
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (!width || !height) {
        setDimensions({
          width: window.innerWidth - 100,
          height: window.innerHeight - 200,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  const handleNodeClick = useCallback((node: any) => {
    const graphNode = node as GraphNode;
    setSelectedNode(graphNode);
    if (onNodeClick) {
      onNodeClick(graphNode);
    }
  }, [onNodeClick]);

  const handleNodeDrag = useCallback((node: any) => {
    // Fix node position while dragging
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  const handleNodeDragEnd = useCallback((node: any) => {
    // Keep node fixed at its position after drag
    node.fx = node.x;
    node.fy = node.y;
  }, []);
  
  // Get connected authors for a paper node
  const getConnectedAuthors = useCallback((paperNode: GraphNode): GraphNode[] => {
    if (paperNode.type !== 'paper') return [];
    
    const authorIds = (data.links as any[])
      .filter((link: any) => {
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        return (targetId === paperNode.id || sourceId === paperNode.id) && 
               (link.type === 'authored' || link.type === 'coauthored');
      })
      .map((link: any) => {
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        return targetId === paperNode.id ? sourceId : targetId;
      });
    
    return data.nodes.filter(node => authorIds.includes(node.id));
  }, [data]);

  const handleNodeHover = useCallback((node: any) => {
    const graphNode = node as GraphNode | null;
    setHoveredNode(graphNode);
    if (onNodeHover) {
      onNodeHover(graphNode);
    }
  }, [onNodeHover]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const graphNode = node as GraphNode;
    const label = graphNode.name;
    const fontSize = 12 / globalScale;
    
    // Calculate node size based on citation count for papers
    let nodeSize = 5;
    if (graphNode.type === 'paper' && graphNode.metadata?.citationCount) {
      const citations = graphNode.metadata.citationCount;
      // Logarithmic scale for better visual distribution
      nodeSize = Math.max(5, Math.min(20, 5 + Math.log10(citations + 1) * 4));
    } else if (graphNode.type === 'researcher') {
      nodeSize = 12;
    } else {
      nodeSize = 6;
    }
    
    const isSelected = selectedNode?.id === graphNode.id;
    const isHovered = hoveredNode?.id === graphNode.id;
    
    // Blue/Mint color palette
    let nodeColor = '#8da9c4'; // Powder blue
    let borderColor = '#13315c';
    
    if (graphNode.type === 'researcher') {
      nodeColor = '#134074'; // Yale blue
      borderColor = '#0b2545';
    } else if (graphNode.type === 'paper') {
      nodeColor = '#13315c'; // Berkeley blue
      borderColor = '#0b2545';
    } else if (graphNode.type === 'coauthor') {
      nodeColor = '#8da9c4'; // Powder blue
      borderColor = '#134074';
    }
    
    // Draw glow for selected/hovered
    if (isSelected || isHovered) {
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize + 4, 0, 2 * Math.PI);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColor;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = isSelected ? '#ffffff' : borderColor;
    ctx.lineWidth = (isSelected ? 4 : 2.5) / globalScale;
    ctx.stroke();
    
    // Draw label with background (only for researcher node)
    if (graphNode.type === 'researcher') {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxLength = 35;
      const truncatedLabel = label.length > maxLength 
        ? label.substring(0, maxLength) + '...' 
        : label;
      
      const textWidth = ctx.measureText(truncatedLabel).width;
      const padding = 6 / globalScale;
      
      // Draw text background
      ctx.fillStyle = 'rgba(238, 244, 237, 0.95)'; // Mint cream
      ctx.strokeStyle = '#8da9c4'; // Powder blue
      ctx.lineWidth = 1 / globalScale;
      ctx.fillRect(
        node.x - textWidth / 2 - padding,
        node.y + nodeSize + 8 / globalScale - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );
      ctx.strokeRect(
        node.x - textWidth / 2 - padding,
        node.y + nodeSize + 8 / globalScale - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      );
      
      // Draw text
      ctx.fillStyle = '#0b2545'; // Oxford blue
      ctx.fillText(truncatedLabel, node.x, node.y + nodeSize + fontSize + 2);
    }
  }, [hoveredNode, selectedNode]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;
    
    // Calculate line width based on link type
    const lineWidth = link.type === 'authored' ? 2 : 1;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    // Different colors for different link types
    switch (link.type) {
      case 'authored':
        ctx.strokeStyle = 'rgba(19, 64, 116, 0.5)'; // Yale blue
        break;
      case 'coauthored':
        ctx.strokeStyle = 'rgba(141, 169, 196, 0.6)'; // Powder blue
        break;
      case 'cited':
        ctx.strokeStyle = 'rgba(19, 49, 92, 0.3)'; // Berkeley blue
        break;
      default:
        ctx.strokeStyle = 'rgba(141, 169, 196, 0.3)';
    }
    
    ctx.lineWidth = lineWidth / globalScale;
    ctx.stroke();
  }, []);

  const connectedAuthors = selectedNode?.type === 'paper' ? getConnectedAuthors(selectedNode) : [];

  return (
    <div className="relative w-full h-full flex">
      {/* Graph Canvas */}
      <div className={`flex-1 transition-all ${selectedNode ? 'mr-96' : ''}`}>
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={selectedNode ? (width || dimensions.width) - 384 : (width || dimensions.width)}
          height={height || dimensions.height}
          nodeLabel={(node: any) => {
            const graphNode = node as GraphNode;
            return `<div style="background: #eef4ed; color: #0b2545; padding: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(19, 64, 116, 0.2); border: 1px solid #8da9c4; max-width: 250px;">
              <strong style="color: #134074;">${graphNode.name}</strong><br/>
              <span style="color: #13315c;">Type: ${graphNode.type}</span><br/>
              ${graphNode.metadata?.citationCount ? `<span style="color: #134074;">Citations: ${graphNode.metadata.citationCount}</span><br/>` : ''}
              ${graphNode.metadata?.year ? `<span style="color: #0b2545;">Year: ${graphNode.metadata.year}</span>` : ''}
            </div>`;
          }}
          nodeCanvasObject={paintNode}
          linkCanvasObject={paintLink}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeDrag={handleNodeDrag}
          onNodeDragEnd={handleNodeDragEnd}
          cooldownTicks={200}
          d3AlphaDecay={0.015}
          d3VelocityDecay={0.15}
          d3ForceConfig={{
            charge: { strength: -3000, distanceMax: 1500 }
          }}
          linkDistance={(link: any) => {
            const source = link.source;
            const target = link.target;
            
            const targetDistance = typeof target === 'object' && target?.metadata?.layoutDistance
              ? target.metadata.layoutDistance
              : undefined;
            const sourceDistance = typeof source === 'object' && source?.metadata?.layoutDistance
              ? source.metadata.layoutDistance
              : undefined;
            
            if (targetDistance || sourceDistance) {
              return targetDistance || sourceDistance;
            }
            
            const targetId = typeof target === 'string' ? target : target.id || '';
            
            // Fallback deterministic distance based on target ID if metadata is missing
            let hash = 2166136261;
            for (let i = 0; i < targetId.length; i++) {
              hash ^= targetId.charCodeAt(i);
              hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
            hash = Math.abs(hash);
            const randomValue = (hash % 1000) / 999;
            return 400 + (randomValue * 1000);
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
        
        {/* Legend */}
        <div className="absolute top-4 left-4 bg-[#eef4ed]/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border-2 border-[#8da9c4]">
          <h3 className="font-bold mb-3 text-sm text-[#0b2545]">Legend</h3>
          <div className="space-y-2 text-xs text-[#13315c]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#134074] border-2 border-[#0b2545] shadow-md"></div>
              <span>Researcher</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#13315c] border-2 border-[#0b2545] shadow-md"></div>
              <span>Paper</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#8da9c4] border-2 border-[#134074] shadow-md"></div>
              <span>Co-author</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#8da9c4] text-xs text-[#13315c]">
            <p className="flex items-center gap-1"><LightBulbIcon className="w-4 h-4" /> Click paper to expand</p>
            <p className="flex items-center gap-1"><CursorArrowRaysIcon className="w-4 h-4" /> Drag to rearrange</p>
            <p className="flex items-center gap-1"><MagnifyingGlassIcon className="w-4 h-4" /> Scroll to zoom</p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[#eef4ed]/98 backdrop-blur-md border-l-2 border-[#8da9c4] shadow-2xl overflow-y-auto">
          {/* Close button */}
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#8da9c4] hover:bg-[#134074] flex items-center justify-center text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Node Type Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                selectedNode.type === 'researcher' ? 'bg-[#134074] text-white' :
                selectedNode.type === 'paper' ? 'bg-[#13315c] text-white' :
                'bg-[#8da9c4] text-white'
              }`}>
                {selectedNode.type.toUpperCase()}
              </span>
            </div>

            {/* Node Name */}
            <h2 className="text-xl font-bold text-[#0b2545] mb-4 leading-tight">
              {selectedNode.name}
            </h2>

            {/* Metadata */}
            {selectedNode.metadata && (
              <div className="space-y-3 mb-6">
                {selectedNode.metadata.year && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-[#13315c]" />
                    <span className="text-[#13315c]">Year:</span>
                    <span className="text-[#0b2545] font-medium">{selectedNode.metadata.year}</span>
                  </div>
                )}
                {selectedNode.metadata.citationCount !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <ChartBarIcon className="w-4 h-4 text-[#13315c]" />
                    <span className="text-[#13315c]">Citations:</span>
                    <span className="text-[#134074] font-bold">{selectedNode.metadata.citationCount.toLocaleString()}</span>
                  </div>
                )}
                {selectedNode.metadata.venue && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-[#13315c] mt-0.5" />
                    <div>
                      <span className="text-[#13315c]">Venue:</span>
                      <p className="text-[#0b2545] mt-1">{selectedNode.metadata.venue}</p>
                    </div>
                  </div>
                )}
                {selectedNode.metadata.link && (
                  <a
                    href={selectedNode.metadata.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#134074] hover:text-[#0b2545] text-sm font-medium"
                  >
                    <LinkIcon className="w-4 h-4" />
                    View Source
                  </a>
                )}
              </div>
            )}

            {/* Authors (for papers) */}
            {selectedNode.type === 'paper' && selectedNode.metadata?.authors && selectedNode.metadata.authors.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#8da9c4]">
                <h3 className="text-sm font-semibold text-[#13315c] mb-3">
                  AUTHORS ({selectedNode.metadata.authors.length})
                </h3>
                <div className="space-y-2">
                  {selectedNode.metadata.authors.map((author, idx) => (
                    <div
                      key={author.id || idx}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-white border border-[#8da9c4] ${
                        author.link ? 'hover:bg-[#8da9c4]/20 transition-colors cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (author.id && author.link) {
                          // Navigate to author's profile if they have an ID
                          const url = new URL(window.location.href);
                          const language = url.searchParams.get('hl') || 'en';
                          window.location.href = `/citations?user=${author.id}&hl=${language}`;
                        }
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-[#134074]"></div>
                      <span className="text-[#0b2545] text-sm flex-1">{author.name}</span>
                      {author.link && (
                        <svg className="w-4 h-4 text-[#13315c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

