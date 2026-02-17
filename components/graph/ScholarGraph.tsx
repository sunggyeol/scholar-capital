'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// @ts-ignore - react-cytoscapejs doesn't have types
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
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

// ── Pure helpers (outside component) ─────────────────────────────

function getNodeSize(node: GraphNode): number {
  if (node.type === 'researcher') return 40;
  if (node.type === 'paper') {
    return Math.max(20, Math.min(50, 20 + Math.log10((node.metadata?.citationCount || 0) + 1) * 8));
  }
  return 25;
}

function getNodePosition(node: GraphNode): { x: number; y: number } | undefined {
  if (node.metadata?.initialAngle !== undefined) {
    const distance = node.metadata.layoutDistance || 300;
    if (node.x !== undefined && node.y !== undefined) {
      return { x: node.x, y: node.y };
    }
    return {
      x: Math.cos(node.metadata.initialAngle) * distance,
      y: Math.sin(node.metadata.initialAngle) * distance
    };
  }
  if (node.x !== undefined && node.y !== undefined) {
    return { x: node.x, y: node.y };
  }
  if (node.type === 'researcher') {
    return { x: 0, y: 0 };
  }
  return undefined;
}

function buildNodeElement(node: GraphNode): any {
  const element: any = {
    group: 'nodes',
    data: {
      id: node.id,
      label: node.name,
      type: node.type,
      nodeData: node,
      size: getNodeSize(node),
    }
  };
  const position = getNodePosition(node);
  if (position) element.position = position;
  return element;
}

function buildLinkElement(link: GraphLink): any {
  return {
    group: 'edges',
    data: {
      id: `${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
      type: link.type
    }
  };
}

function createTooltipElement(nodeData: GraphNode): HTMLDivElement {
  const tooltipDiv = document.createElement('div');
  tooltipDiv.className = 'cytoscape-tooltip';
  tooltipDiv.style.cssText = `
    position: absolute;
    background: #eef4ed;
    color: #0b2545;
    padding: 12px 14px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(19, 64, 116, 0.15);
    border: 1.5px solid #8da9c4;
    max-width: 280px;
    font-size: 13px;
    pointer-events: none;
    z-index: 9999;
    line-height: 1.4;
    backdrop-filter: blur(8px);
    background: rgba(238, 244, 237, 0.98);
  `;

  const title = document.createElement('strong');
  title.style.color = '#134074';
  title.textContent = nodeData.name;
  tooltipDiv.appendChild(title);

  if (nodeData.metadata?.citationCount !== undefined) {
    tooltipDiv.appendChild(document.createElement('br'));
    const citSpan = document.createElement('span');
    citSpan.style.color = '#134074';
    citSpan.textContent = `Citations: ${nodeData.metadata.citationCount}`;
    tooltipDiv.appendChild(citSpan);
  }

  if (nodeData.metadata?.year) {
    tooltipDiv.appendChild(document.createElement('br'));
    const yearSpan = document.createElement('span');
    yearSpan.style.color = '#0b2545';
    yearSpan.textContent = `Year: ${nodeData.metadata.year}`;
    tooltipDiv.appendChild(yearSpan);
  }

  return tooltipDiv;
}

// ── Component ────────────────────────────────────────────────────

interface ScholarGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onAuthorClick?: (authorName: string, authorId?: string) => Promise<any>;
  onExpandResearcher?: (authorName: string, authorId?: string, sourcePaperId?: string) => Promise<void>;
  authorProfiles?: Map<string, any>;
  expandingContext?: { sourcePaperId?: string; researcherName: string } | null;
  language?: string;
  width?: number;
  height?: number;
}

export function ScholarGraph({
  data,
  onNodeClick,
  onAuthorClick,
  onExpandResearcher,
  authorProfiles,
  expandingContext,
  language = 'en',
  width,
  height
}: ScholarGraphProps) {
  // ── Refs ──
  const cyRef = useRef<Cytoscape.Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const prevDataRef = useRef<GraphData | null>(null);
  const isExpandingRef = useRef(false);
  const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── State ──
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [cytoscapeElements, setCytoscapeElements] = useState<any[]>([]);
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState<string | null>(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [expandingFromPaperId, setExpandingFromPaperId] = useState<string | null>(null);

  // ── Dimensions ──
  useEffect(() => {
    const updateDimensions = () => {
      if (!width || !height) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({ width: rect.width, height: rect.height });
        } else {
          setDimensions({ width: window.innerWidth, height: window.innerHeight });
        }
      }
    };

    const initialTimer = setTimeout(updateDimensions, 0);
    window.addEventListener('resize', updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, [width, height]);

  // ── Pulse animation ──
  const stopPulseAnimation = useCallback(() => {
    if (pulseIntervalRef.current) {
      clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  }, []);

  const startPulseAnimation = useCallback((placeholderIds: string[]) => {
    stopPulseAnimation();
    const cy = cyRef.current;
    if (!cy) return;

    let tick = 0;
    pulseIntervalRef.current = setInterval(() => {
      tick++;
      const activeCy = cyRef.current;
      if (!activeCy) return;
      placeholderIds.forEach((id, i) => {
        const ele = activeCy.getElementById(id);
        if (ele.length === 0) return;
        const phase = (tick * 0.1 + i * 0.3) % (2 * Math.PI);
        const opacity = 0.3 + 0.2 * Math.sin(phase);
        ele.style('opacity', opacity);
      });
    }, 50);
  }, [stopPulseAnimation]);

  // ── Incremental graph updates ──
  useEffect(() => {
    if (!data?.nodes || data.nodes.length === 0) {
      setCytoscapeElements([]);
      prevDataRef.current = data;
      isInitializedRef.current = false;
      return;
    }

    const cy = cyRef.current;

    // Initial render or cy not ready: build all elements for CytoscapeComponent
    if (!isInitializedRef.current || !cy) {
      const elements = [
        ...data.nodes.map(buildNodeElement),
        ...data.links.map(buildLinkElement),
      ];
      setCytoscapeElements(elements);
      prevDataRef.current = data;
      if (data.nodes.length > 0) isInitializedRef.current = true;
      return;
    }

    // ── Incremental update via imperative API ──
    const prevData = prevDataRef.current;
    prevDataRef.current = data;
    if (!prevData) return;

    // Diff nodes
    const prevNodeIds = new Set(prevData.nodes.map(n => n.id));
    const currNodeIds = new Set(data.nodes.map(n => n.id));
    const addedNodes = data.nodes.filter(n => !prevNodeIds.has(n.id));
    const removedNodeIds = [...prevNodeIds].filter(id => !currNodeIds.has(id));

    // Diff links
    const prevLinkKeys = new Set(prevData.links.map(l => `${l.source}-${l.target}`));
    const currLinkKeys = new Set(data.links.map(l => `${l.source}-${l.target}`));
    const addedLinks = data.links.filter(l => !prevLinkKeys.has(`${l.source}-${l.target}`));
    const removedLinkKeys = [...prevLinkKeys].filter(k => !currLinkKeys.has(k));

    // Updated nodes (same ID, possibly changed data)
    const updatedNodes = data.nodes.filter(n => prevNodeIds.has(n.id));

    // Detect scenario
    const hasNewPlaceholders = addedNodes.some(n => n.id.startsWith('placeholder-'));
    const hasRemovedPlaceholders = removedNodeIds.some(id => id.startsWith('placeholder-'));

    if (hasNewPlaceholders) {
      // ── Scenario 1: Placeholder entrance (staggered fly-out) ──
      const researcherNode = addedNodes.find(n => n.type === 'researcher');
      const placeholderNodes = addedNodes.filter(n => n.id.startsWith('placeholder-'));
      const otherAddedNodes = addedNodes.filter(n => n.type !== 'researcher' && !n.id.startsWith('placeholder-'));

      const centerX = researcherNode ? (researcherNode.x ?? 0) : 0;
      const centerY = researcherNode ? (researcherNode.y ?? 0) : 0;

      cy.batch(() => {
        // Remove any removed elements
        removedNodeIds.forEach(id => {
          const ele = cy.getElementById(id);
          if (ele.length) ele.remove();
        });
        removedLinkKeys.forEach(key => {
          const ele = cy.getElementById(key);
          if (ele.length) ele.remove();
        });

        // Add researcher node
        if (researcherNode) {
          cy.add(buildNodeElement(researcherNode));
        }

        // Add other non-placeholder nodes
        otherAddedNodes.forEach(node => {
          cy.add(buildNodeElement(node));
        });

        // Add placeholders at researcher center, invisible
        placeholderNodes.forEach(node => {
          const ele = buildNodeElement(node);
          ele.position = { x: centerX, y: centerY };
          cy.add(ele);
        });

        // Add all new edges
        addedLinks.forEach(link => {
          const linkId = `${link.source}-${link.target}`;
          if (cy.getElementById(linkId).length === 0) {
            cy.add(buildLinkElement(link));
          }
        });
      });

      // Update existing nodes data
      updatedNodes.forEach(node => {
        const ele = cy.getElementById(node.id);
        if (ele.length > 0) {
          ele.data('nodeData', node);
          ele.data('label', node.name);
          ele.data('size', getNodeSize(node));
        }
      });

      // Set placeholders invisible and small
      placeholderNodes.forEach(node => {
        const ele = cy.getElementById(node.id);
        if (ele.length) {
          ele.style({ 'opacity': 0, 'width': 5, 'height': 5 });
        }
      });

      // Pan to researcher, then animate placeholders outward
      const researcherEleId = researcherNode?.id;
      if (researcherEleId) {
        cy.animate({
          center: { eles: cy.getElementById(researcherEleId) },
          duration: 300,
          easing: 'ease-out-cubic' as any,
          complete: () => {
            // Stagger animate placeholders outward
            placeholderNodes.forEach((node, i) => {
              const targetPos = getNodePosition(node) || { x: centerX, y: centerY };
              const ele = cy.getElementById(node.id);
              if (ele.length === 0) return;

              setTimeout(() => {
                ele.animate({
                  position: targetPos,
                  style: { 'opacity': 0.5, 'width': 25, 'height': 25 },
                  duration: 400,
                  easing: 'ease-out-cubic' as any,
                });
              }, i * 20);
            });

            // Fit all after stagger completes
            setTimeout(() => {
              cy.animate({
                fit: { eles: cy.elements(), padding: 50 },
                duration: 600,
                easing: 'ease-out-cubic' as any,
              });
            }, placeholderNodes.length * 20 + 400);
          }
        });
      }

      // Start pulse animation
      startPulseAnimation(placeholderNodes.map(n => n.id));

    } else if (hasRemovedPlaceholders) {
      // ── Scenario 2: Placeholder-to-real replacement ──
      stopPulseAnimation();

      // Fade out all placeholder nodes
      const placeholderEles = removedNodeIds
        .filter(id => id.startsWith('placeholder-'))
        .map(id => cy.getElementById(id))
        .filter(ele => ele.length > 0);

      placeholderEles.forEach(ele => {
        ele.animate({
          style: { 'opacity': 0, 'width': 5, 'height': 5 },
          duration: 200,
          easing: 'ease-in-cubic' as any,
        });
      });

      // Also fade out extra placeholder nodes that aren't replaced
      const nonPlaceholderRemovedIds = removedNodeIds.filter(id => !id.startsWith('placeholder-'));

      // After fade-out, swap placeholders for real papers
      setTimeout(() => {
        cy.batch(() => {
          // Remove all removed nodes (placeholders + extras)
          removedNodeIds.forEach(id => {
            const ele = cy.getElementById(id);
            if (ele.length) ele.remove();
          });
          removedLinkKeys.forEach(key => {
            const ele = cy.getElementById(key);
            if (ele.length) ele.remove();
          });

          // Add real paper nodes
          addedNodes.forEach(node => {
            cy.add(buildNodeElement(node));
          });

          // Add new edges
          addedLinks.forEach(link => {
            const linkId = `${link.source}-${link.target}`;
            if (cy.getElementById(linkId).length === 0) {
              cy.add(buildLinkElement(link));
            }
          });
        });

        // Set new papers invisible initially
        addedNodes.forEach(node => {
          const ele = cy.getElementById(node.id);
          if (ele.length) {
            ele.style({ 'opacity': 0, 'width': 5, 'height': 5 });
          }
        });

        // Update existing nodes data (e.g., researcher loading → false)
        updatedNodes.forEach(node => {
          const ele = cy.getElementById(node.id);
          if (ele.length > 0) {
            ele.data('nodeData', node);
            ele.data('label', node.name);
            ele.data('size', getNodeSize(node));
          }
        });

        // Stagger fade-in of real papers
        addedNodes.forEach((node, i) => {
          const ele = cy.getElementById(node.id);
          if (ele.length === 0) return;
          const targetSize = getNodeSize(node);

          setTimeout(() => {
            ele.animate({
              style: {
                'opacity': 1,
                'width': targetSize,
                'height': targetSize,
              },
              duration: 350,
              easing: 'ease-out-cubic' as any,
            });
          }, i * 15);
        });

        // Camera reframe after all fade-ins complete
        const totalFadeTime = addedNodes.length * 15 + 350;
        setTimeout(() => {
          cy.animate({
            fit: { eles: cy.elements(), padding: 50 },
            duration: 500,
            easing: 'ease-out-cubic' as any,
          });

          // Clear expansion state
          isExpandingRef.current = false;
          setExpandingFromPaperId(null);
        }, totalFadeTime);

      }, 220); // wait for placeholder fade-out

    } else if (addedNodes.length > 0 || removedNodeIds.length > 0) {
      // ── Scenario 3: Generic update (load more papers, etc.) ──
      cy.batch(() => {
        removedNodeIds.forEach(id => {
          const ele = cy.getElementById(id);
          if (ele.length) ele.remove();
        });
        removedLinkKeys.forEach(key => {
          const ele = cy.getElementById(key);
          if (ele.length) ele.remove();
        });

        addedNodes.forEach(node => {
          cy.add(buildNodeElement(node));
        });

        addedLinks.forEach(link => {
          const linkId = `${link.source}-${link.target}`;
          if (cy.getElementById(linkId).length === 0) {
            cy.add(buildLinkElement(link));
          }
        });
      });

      // Update existing nodes
      updatedNodes.forEach(node => {
        const ele = cy.getElementById(node.id);
        if (ele.length > 0) {
          ele.data('nodeData', node);
          ele.data('label', node.name);
          ele.data('size', getNodeSize(node));
        }
      });

      // Smooth camera fit
      cy.animate({
        fit: { eles: cy.elements(), padding: 50 },
        duration: 500,
        easing: 'ease-out-cubic' as any,
      });

    } else {
      // ── No structural changes, just data updates ──
      updatedNodes.forEach(node => {
        const ele = cy.getElementById(node.id);
        if (ele.length > 0) {
          ele.data('nodeData', node);
          ele.data('label', node.name);
          ele.data('size', getNodeSize(node));
        }
      });
    }
  }, [data, startPulseAnimation, stopPulseAnimation]);

  // ── Source paper highlight ──
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !expandingFromPaperId) return;

    const sourceNode = cy.getElementById(expandingFromPaperId);
    if (sourceNode.length === 0) return;

    sourceNode.animate({
      style: {
        'border-color': '#f59e0b',
        'border-width': 6,
        'overlay-opacity': 0.15,
        'overlay-color': '#f59e0b',
        'overlay-padding': 10,
      },
      duration: 300,
      easing: 'ease-out-cubic' as any,
    });

    return () => {
      if (sourceNode.length > 0) {
        sourceNode.stop();
        sourceNode.removeStyle('border-color border-width overlay-opacity overlay-color overlay-padding');
      }
    };
  }, [expandingFromPaperId]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopPulseAnimation();
      if (cyRef.current) {
        cyRef.current.nodes().stop();
      }
    };
  }, [stopPulseAnimation]);

  // ── Cytoscape initialization ──
  const handleCyInit = useCallback((cy: Cytoscape.Core) => {
    cyRef.current = cy;

    // Run layout for nodes without positions
    const nodesWithoutPosition = cy.nodes().filter(node =>
      node.position().x === undefined || node.position().y === undefined
    );

    if (nodesWithoutPosition.length > 0) {
      cy.layout({
        name: 'circle',
        fit: false,
        avoidOverlap: true,
        radius: 300
      }).run();
    }

    cy.fit(undefined, 50);

    // Tooltips
    let tooltipDiv: HTMLDivElement | null = null;

    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data('nodeData') as GraphNode;
      if (nodeData.type !== 'paper' || nodeData.metadata?.loading) return;

      tooltipDiv = createTooltipElement(nodeData);
      document.body.appendChild(tooltipDiv);

      const mouseMoveHandler = (e: MouseEvent) => {
        if (tooltipDiv) {
          tooltipDiv.style.left = `${e.clientX + 10}px`;
          tooltipDiv.style.top = `${e.clientY + 10}px`;
        }
      };
      document.addEventListener('mousemove', mouseMoveHandler);
      (tooltipDiv as any)._mouseMoveHandler = mouseMoveHandler;
    });

    cy.on('mouseout', 'node', () => {
      if (tooltipDiv) {
        const handler = (tooltipDiv as any)._mouseMoveHandler;
        if (handler) {
          document.removeEventListener('mousemove', handler);
        }
        tooltipDiv.remove();
        tooltipDiv = null;
      }
    });

    // Node click
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data('nodeData') as GraphNode;
      setSelectedNode(nodeData);
      if (onNodeClick) {
        onNodeClick(nodeData);
      }
    });

    // Background click to deselect
    cy.on('tap', (event) => {
      if (event.target === cy) {
        setSelectedNode(null);
        setExpandingFromPaperId(null);
        isExpandingRef.current = false;
      }
    });

    // Group dragging logic
    let dragNodes: any[] = [];
    let initialPositions: Map<string, { x: number; y: number }> = new Map();

    cy.on('grab', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data('nodeData') as GraphNode;

      if (nodeData.type === 'researcher') {
        const connectedEdges = node.connectedEdges();
        const connectedNodes = connectedEdges.connectedNodes().filter((n: any) => {
          const data = n.data('nodeData');
          return data.type === 'paper' && n.id() !== node.id();
        });

        dragNodes = connectedNodes.toArray();
        initialPositions.clear();

        dragNodes.forEach(child => {
          const childPos = child.position();
          const parentPos = node.position();
          initialPositions.set(child.id(), {
            x: childPos.x - parentPos.x,
            y: childPos.y - parentPos.y
          });
        });
      }
    });

    cy.on('drag', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data('nodeData') as GraphNode;
      const isCtrlPressed = event.originalEvent.ctrlKey || event.originalEvent.metaKey;

      if (nodeData.type === 'researcher' && dragNodes.length > 0 && !isCtrlPressed) {
        const parentPos = node.position();
        dragNodes.forEach(child => {
          const offset = initialPositions.get(child.id());
          if (offset) {
            child.position({
              x: parentPos.x + offset.x,
              y: parentPos.y + offset.y
            });
          }
        });
      }
    });

    cy.on('free', 'node', () => {
      dragNodes = [];
      initialPositions.clear();
    });
  }, [onNodeClick]);

  // ── Drawer auto-close handler ──
  const handleAuthorExpand = useCallback(async (authorName: string, authorId?: string) => {
    if (!onExpandResearcher || !selectedNode || isExpandingRef.current) return;

    isExpandingRef.current = true;
    setExpandingFromPaperId(selectedNode.id);
    setLoadingAuthor(authorName);

    // Start drawer close after delay
    const drawerTimer = setTimeout(() => {
      setIsDrawerClosing(true);
      setTimeout(() => {
        setSelectedNode(null);
        setIsDrawerClosing(false);
      }, 300);
    }, 400);

    try {
      await onExpandResearcher(authorName, authorId, selectedNode.id);
    } catch {
      clearTimeout(drawerTimer);
      setExpandingFromPaperId(null);
      isExpandingRef.current = false;
    }

    setLoadingAuthor(null);
  }, [onExpandResearcher, selectedNode]);

  // ── Computed values ──
  const graphWidth = width || dimensions.width;
  const graphHeight = height || dimensions.height;

  const componentStyle = useMemo(() => ({
    width: `${graphWidth}px`,
    height: `${graphHeight}px`,
  }), [graphWidth, graphHeight]);

  // ── Stylesheet ──
  const stylesheet: Cytoscape.StylesheetStyle[] = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': (ele: any) => {
          const type = ele.data('type');
          const nodeData = ele.data('nodeData');
          if (type === 'researcher') return '#8da9c4';
          if (type === 'paper') {
            if (nodeData?.metadata?.loading) return '#8da9c4';
            return '#13315c';
          }
          return '#134074';
        },
        'width': (ele: any) => ele.data('size'),
        'height': (ele: any) => ele.data('size'),
        'label': (ele: any) => {
          const type = ele.data('type');
          if (type === 'researcher') return ele.data('label');
          if (type === 'paper') {
            const nodeData = ele.data('nodeData');
            if (nodeData?.metadata?.loading) return '';
            return nodeData?.metadata?.year || '';
          }
          return '';
        },
        'color': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? '#ffffff' : '#0b2545';
        },
        'text-valign': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? 'center' : 'bottom';
        },
        'text-halign': 'center',
        'text-margin-y': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? 0 : 5;
        },
        'font-size': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? '9px' : '12px';
        },
        'font-weight': 'bold',
        'text-wrap': 'wrap',
        'text-max-width': '120px',
        'border-width': 3,
        'border-color': '#0b2545',
        'text-background-color': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? 'transparent' : '#eef4ed';
        },
        'text-background-opacity': (ele: any) => {
          const type = ele.data('type');
          return type === 'paper' ? 0 : 0.9;
        },
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle'
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 5,
        'border-color': '#ffffff',
        'overlay-opacity': 0.2,
        'overlay-color': '#134074',
        'overlay-padding': 8
      }
    },
    {
      selector: 'node:active',
      style: {
        'overlay-opacity': 0.3,
        'overlay-color': '#134074'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': (ele: any) => {
          const type = ele.data('type');
          return type === 'authored' ? 3 : 2;
        },
        'line-color': (ele: any) => {
          const type = ele.data('type');
          if (type === 'authored') return 'rgba(19, 64, 116, 0.6)';
          if (type === 'coauthored') return 'rgba(141, 169, 196, 0.7)';
          return 'rgba(19, 49, 92, 0.4)';
        },
        'curve-style': 'straight',
        'target-arrow-shape': 'none'
      }
    }
  ], []);

  // ── Render ──

  if (!cytoscapeElements || cytoscapeElements.length === 0) {
    return (
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-[#eef4ed]">
        <div className="text-center">
          <div className="text-lg font-semibold text-[#0b2545] mb-2">Loading Graph</div>
          <div className="text-sm text-[#13315c]">
            {data?.nodes?.length ? `Initializing ${data.nodes.length} nodes...` : 'Waiting for data...'}
          </div>
        </div>
      </div>
    );
  }

  // Shared drawer content renderer
  const renderDrawerContent = (isMobile: boolean) => {
    if (!selectedNode) return null;
    const padding = isMobile ? 'p-4' : 'p-6';

    return (
      <div className={padding}>
        {/* Node Type Badge */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedNode.type === 'researcher' ? 'bg-[#8da9c4] text-white' :
            selectedNode.type === 'paper' ? 'bg-[#13315c] text-white' :
              'bg-[#134074] text-white'
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
                View Paper
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
              {selectedNode.metadata.authors.map((author, idx) => {
                const authorProfile = authorProfiles?.get(author.name);
                const isExpanded = expandedAuthor === author.name;
                const isLoading = loadingAuthor === author.name;

                return (
                  <div key={author.id || idx}>
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg bg-white border border-[#8da9c4] hover:bg-[#8da9c4]/20 transition-colors cursor-pointer"
                      onClick={async () => {
                        if (onExpandResearcher) {
                          handleAuthorExpand(author.name, author.id);
                        } else {
                          if (isExpanded) {
                            setExpandedAuthor(null);
                          } else {
                            setExpandedAuthor(author.name);
                            if (!authorProfile && onAuthorClick) {
                              setLoadingAuthor(author.name);
                              await onAuthorClick(author.name, author.id);
                              setLoadingAuthor(null);
                            }
                          }
                        }
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-[#134074]"></div>
                      <span className="text-[#0b2545] text-sm flex-1">{author.name}</span>
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-[#134074] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        !onExpandResearcher && <svg
                          className={`w-4 h-4 text-[#13315c] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      {onExpandResearcher && !isLoading && (
                        <svg className="w-4 h-4 text-[#13315c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                    {isExpanded && authorProfile && !onExpandResearcher && (
                      <div className="ml-6 mt-2 p-3 bg-[#eef4ed] border border-[#8da9c4] rounded-lg text-sm">
                        {authorProfile.affiliations && (
                          <div className="mb-2">
                            <span className="text-[#13315c] font-medium">Affiliation:</span>
                            <p className="text-[#0b2545] mt-1">{authorProfile.affiliations}</p>
                          </div>
                        )}
                        {authorProfile.cited_by !== undefined && (
                          <div className="mb-2">
                            <span className="text-[#13315c] font-medium">Total Citations:</span>
                            <span className="text-[#134074] font-bold ml-2">{authorProfile.cited_by.toLocaleString()}</span>
                          </div>
                        )}
                        {authorProfile.author_id && (
                          <a
                            href={`/citations?user=${authorProfile.author_id}&hl=${language}`}
                            className="inline-flex items-center gap-1 text-[#134074] hover:text-[#0b2545] font-medium mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Full Profile
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex overflow-hidden">
      {/* Graph Canvas */}
      <div className="flex-1 bg-[#eef4ed] overflow-hidden">
        <CytoscapeComponent
          elements={cytoscapeElements}
          style={componentStyle}
          stylesheet={stylesheet}
          cy={handleCyInit}
          wheelSensitivity={0.2}
          minZoom={0.3}
          maxZoom={3}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 md:top-4 md:bottom-auto md:right-auto md:w-auto bg-[#eef4ed]/95 backdrop-blur-sm p-3 md:p-4 rounded-xl shadow-lg border-2 border-[#8da9c4] z-10">
          <h3 className="font-bold mb-2 md:mb-3 text-xs md:text-sm text-[#0b2545]">Legend</h3>
          <div className="flex md:flex-col gap-4 md:gap-0 md:space-y-2 text-xs text-[#13315c]">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#8da9c4] border-2 border-[#0b2545] shadow-md flex-shrink-0"></div>
              <span className="whitespace-nowrap">Researcher</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#13315c] border-2 border-[#0b2545] shadow-md flex-shrink-0"></div>
              <span className="whitespace-nowrap">Paper</span>
            </div>
          </div>
          <div className="hidden md:block mt-3 pt-3 border-t border-[#8da9c4] text-xs text-[#13315c]">
            <p className="flex items-center gap-1"><LightBulbIcon className="w-4 h-4" /> Click paper to expand</p>
            <p className="flex items-center gap-1"><CursorArrowRaysIcon className="w-4 h-4" /> Drag to rearrange</p>
            <p className="flex items-center gap-1"><MagnifyingGlassIcon className="w-4 h-4" /> Scroll to zoom</p>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {selectedNode && (
        <div
          className={`md:hidden absolute inset-0 bg-black/30 z-20 ${isDrawerClosing ? 'backdrop-fade-out' : 'backdrop-fade'}`}
          onClick={() => {
            setSelectedNode(null);
            setIsDrawerClosing(false);
          }}
        />
      )}

      {/* Mobile drawer - Bottom */}
      {selectedNode && (
        <div className={`md:hidden absolute left-0 right-0 bottom-0 max-h-[70vh] bg-[#eef4ed]/98 backdrop-blur-md border-t-2 border-[#8da9c4] shadow-2xl overflow-y-auto z-30 scrollbar-hide ${isDrawerClosing ? 'drawer-slide-out-bottom' : 'drawer-slide-bottom'}`}>
          {/* Drag handle */}
          <div className="sticky top-0 bg-[#eef4ed]/98 backdrop-blur-md py-2 flex justify-center border-b border-[#8da9c4]/30">
            <div className="w-12 h-1 bg-[#8da9c4] rounded-full"></div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setSelectedNode(null);
              setIsDrawerClosing(false);
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#8da9c4] hover:bg-[#134074] flex items-center justify-center text-white transition-colors z-30"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {renderDrawerContent(true)}
        </div>
      )}

      {/* Desktop drawer - Right side */}
      {selectedNode && (
        <div className={`hidden md:block absolute top-0 bottom-0 right-0 w-96 bg-[#eef4ed]/98 backdrop-blur-md border-l-2 border-[#8da9c4] shadow-2xl overflow-y-auto z-30 scrollbar-hide ${isDrawerClosing ? 'drawer-slide-out-right' : 'drawer-slide-right'}`}>
          {/* Close button */}
          <button
            onClick={() => {
              setSelectedNode(null);
              setIsDrawerClosing(false);
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#8da9c4] hover:bg-[#134074] flex items-center justify-center text-white transition-colors z-30"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {renderDrawerContent(false)}
        </div>
      )}
    </div>
  );
}
