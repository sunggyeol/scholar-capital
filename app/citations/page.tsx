'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScholarGraph } from '@/components/graph/ScholarGraph';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { transformAuthorToGraph, addMorePapers } from '@/lib/utils/graph-transformer';
import { GraphData, GraphNode } from '@/lib/types/graph';
import { ScholarAuthorResponse } from '@/lib/types/scholar';

function CitationsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');
  const language = searchParams.get('hl') || 'en';

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [authorData, setAuthorData] = useState<ScholarAuthorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePapers, setVisiblePapers] = useState(20);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Prevent body scroll on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setError('Missing user ID in URL. Please provide a valid Google Scholar user ID.');
      setLoading(false);
      return;
    }

    fetchAuthorData();
  }, [userId, language]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/scholar/author?user=${userId}&hl=${language}&results=20&sortby=pubdate`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch author data');
      }

      const data: ScholarAuthorResponse = await response.json();
      setAuthorData(data);

      // Transform to graph data
      const graph = transformAuthorToGraph(data, {
        maxPapers: visiblePapers,
        includeCoAuthors: false,
      });

      setGraphData(graph);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching author data:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleLoadMorePapers = (count: number) => {
    if (!authorData || !graphData) return;

    const currentCount = visiblePapers;
    const newCount = Math.min(count, authorData.articles.length);
    
    if (newCount > currentCount) {
      const additionalPapers = authorData.articles.slice(currentCount, newCount);
      const researcherId = `researcher-${authorData.author.name}`;
      const updatedGraph = addMorePapers(graphData, researcherId, additionalPapers);
      
      setGraphData(updatedGraph);
      setVisiblePapers(newCount);
    }
  };

  const handleNodeClick = async (node: GraphNode) => {
    setSelectedNode(node);
    
    // Handle different node types
    if (node.type === 'paper') {
      // Fetch full author names using view_citation endpoint
      if (node.metadata?.citation_id && userId) {
        try {
          const response = await fetch(
            `/api/scholar/author?user=${userId}&view_op=view_citation&citation_id=${node.metadata.citation_id}&hl=${language}`
          );
          
          if (response.ok) {
            const citationData = await response.json();
            
            // Extract full author names and venue from citation data
            if (graphData && citationData.citation) {
              const citation = citationData.citation;
              
              // Get full author names
              if (citation.authors) {
                const authorsString = citation.authors;
                
                // Parse comma-separated author names
                const fullAuthorNames = authorsString.split(',').map((name: string) => name.trim());
                
                // Create authors list with full names
                const authorsList = fullAuthorNames.map((name: string) => ({
                  name,
                  id: undefined,
                  link: undefined,
                }));
                
                // Get full venue/publication info
                let fullVenue = node.metadata?.venue;
                if (citation.conference) {
                  fullVenue = citation.conference;
                } else if (citation.journal) {
                  fullVenue = citation.journal;
                } else if (citation.book) {
                  fullVenue = citation.book;
                } else if (citation.publisher) {
                  fullVenue = citation.publisher;
                } else {
                  // Default to Unknown if no venue information found
                  fullVenue = 'Unknown';
                }
                
                // Find the actual node object in graphData and update it in place
                const actualNode = graphData.nodes.find(n => n.id === node.id);
                if (actualNode && actualNode.metadata) {
                  // Mutate the node's metadata directly
                  actualNode.metadata.authors = authorsList;
                  if (fullVenue) {
                    actualNode.metadata.venue = fullVenue;
                  }
                  
                  // Trigger a re-render by creating a new graphData reference
                  // but keep the same node objects (so graph doesn't reset)
                  setGraphData({
                    nodes: [...graphData.nodes],
                    links: graphData.links,
                  });
                }
              }
            }
          } else {
            console.error('Failed to fetch citation data:', response.status);
          }
        } catch (error) {
          console.error('Error fetching full author names:', error);
        }
      }
    } else if (node.type === 'coauthor' && node.metadata?.authorId) {
      // Navigate to co-author's profile
      window.location.href = `/citations?user=${node.metadata.authorId}&hl=${language}`;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading scholar network..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAuthorData} />;
  }

  if (!graphData || !authorData) {
    return <ErrorMessage message="No data available" />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#eef4ed] overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#8da9c4] to-[#d1dde7] border-b border-[#134074] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Home Button with Logo */}
            <a 
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-xl font-bold text-[#0b2545] font-mono">
                Scholar<span className="text-[#134074]">Capital</span>
              </div>
            </a>
            
            {/* Divider */}
            <div className="h-6 w-px bg-[#134074]"></div>
            
            {/* Author Info */}
            <div>
              <h1 className="text-xl font-bold text-[#0b2545]">
                {authorData.author.name}
              </h1>
              {authorData.author.affiliations && (
                <p className="text-sm text-[#13315c] mt-1">
                  {authorData.author.affiliations}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Citation stats */}
            {authorData.cited_by && authorData.cited_by.table?.[0] && (
              <div className="text-right">
                <div className="text-sm text-[#13315c]">Total Citations</div>
                <div className="text-xl font-bold text-[#134074]">
                  {authorData.cited_by.table[0].citations?.all.toLocaleString()}
                </div>
              </div>
            )}
            
            {/* H-index */}
            {authorData.cited_by && authorData.cited_by.table?.[1] && (
              <div className="text-right">
                <div className="text-sm text-[#13315c]">h-index</div>
                <div className="text-xl font-bold text-[#0b2545]">
                  {authorData.cited_by.table[1].h_index?.all}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Control Panel */}
      <div className="bg-white border-b border-[#8da9c4] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#13315c]">
            Showing {Math.min(visiblePapers, authorData.articles.length)} recent papers
          </span>
          
          {visiblePapers < authorData.articles.length && (
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadMorePapers(visiblePapers + 20)}
                className="px-3 py-1 text-sm bg-[#134074] text-white rounded hover:bg-[#0b2545] transition-colors"
              >
                Load 20 more papers
              </button>
              <button
                onClick={() => handleLoadMorePapers(authorData.articles.length)}
                className="px-3 py-1 text-sm bg-[#13315c] text-white rounded hover:bg-[#0b2545] transition-colors"
              >
                Load All ({authorData.articles.length})
              </button>
            </div>
          )}
        </div>
        
        {selectedNode && (
          <div className="text-sm">
            <span className="text-[#13315c]">Selected: </span>
            <span className="font-semibold text-[#0b2545]">{selectedNode.name}</span>
          </div>
        )}
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 overflow-hidden">
        <ScholarGraph
          data={graphData}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
}

export default function CitationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <CitationsContent />
    </Suspense>
  );
}

