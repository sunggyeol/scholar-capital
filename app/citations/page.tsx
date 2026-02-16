'use client';

import { useEffect, useState, Suspense, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScholarGraph } from '@/components/graph/ScholarGraph';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { transformAuthorToGraph, addMorePapers, addResearcherToGraph, addResearcherPlaceholders, updateResearcherPapers } from '@/lib/utils/graph-transformer';
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
  const [authorProfiles, setAuthorProfiles] = useState<Map<string, any>>(new Map());

  // Cache for citation details to prevent duplicate API calls - use useRef to persist across renders
  const citationCache = useRef<Map<string, any>>(new Map());

  // Track pending requests to prevent duplicate fetches for the same citation
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  // Track pending author profile requests
  const pendingAuthorRequests = useRef<Map<string, Promise<any>>>(new Map());

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

      // Sort articles by year in descending order (newest first)
      const sortedData = {
        ...data,
        articles: [...(data.articles || [])].sort((a, b) => {
          const yearA = a.year ? parseInt(String(a.year), 10) : 0;
          const yearB = b.year ? parseInt(String(b.year), 10) : 0;
          return yearB - yearA; // Descending order (newest first)
        }),
      };

      setAuthorData(sortedData);

      // Transform to graph data
      const graph = transformAuthorToGraph(sortedData, {
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
    if (!authorData || !graphData || !authorData.author) return;

    const articles = authorData.articles || [];
    const currentCount = visiblePapers;
    const newCount = Math.min(count, articles.length);

    if (newCount > currentCount) {
      const additionalPapers = articles.slice(currentCount, newCount);
      const researcherId = `researcher-${authorData.author.name}`;
      const updatedGraph = addMorePapers(graphData, researcherId, additionalPapers);

      setGraphData(updatedGraph);
      setVisiblePapers(newCount);
    }
  };

  // Helper function to update node with citation data
  const updateNodeWithCitationData = useCallback((node: GraphNode, citationData: any) => {
    if (!graphData || !citationData.citation) return;

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
  }, [graphData]);

  // Fetch author profile information
  const fetchAuthorProfile = useCallback(async (authorName: string, authorId?: string) => {
    // Check if we already have this data
    if (authorProfiles.has(authorName)) {
      return authorProfiles.get(authorName);
    }

    // Check if there's already a pending request
    if (pendingAuthorRequests.current.has(authorName)) {
      try {
        return await pendingAuthorRequests.current.get(authorName);
      } catch (error) {
        console.error('Error waiting for pending author request:', error);
        return null;
      }
    }

    // Fetch from API
    const fetchPromise = (async () => {
      try {
        // If we have author ID, use the author endpoint directly
        if (authorId) {
          const response = await fetch(`/api/scholar/author?user=${authorId}&hl=${language}`);
          if (response.ok) {
            const data = await response.json();
            return {
              name: data.author.name,
              affiliations: data.author.affiliations,
              cited_by: data.cited_by?.table?.[0]?.citations?.all,
              author_id: authorId,
            };
          }
        } else {
          // Otherwise, search for the author by name
          const response = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(authorName)}&hl=${language}&results=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.profiles && data.profiles.length > 0) {
              const profile = data.profiles[0];
              return {
                name: profile.name,
                affiliations: profile.affiliations,
                cited_by: profile.cited_by?.total,
                author_id: profile.author_id,
              };
            }
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching author profile:', error);
        return null;
      } finally {
        pendingAuthorRequests.current.delete(authorName);
      }
    })();

    pendingAuthorRequests.current.set(authorName, fetchPromise);
    const result = await fetchPromise;

    if (result) {
      setAuthorProfiles(prev => new Map(prev).set(authorName, result));
    }
    return result;
  }, [authorProfiles, language]);

  const handleExpandResearcher = useCallback(async (authorName: string, authorId?: string, sourcePaperId?: string) => {
    console.log('handleExpandResearcher called', { authorName, authorId, sourcePaperId });

    if (!graphData) return;

    let targetAuthorId = authorId;

    try {
      // If no ID, search for the author first
      if (!targetAuthorId) {
        console.log('No author ID, searching for profile...', authorName);
        const searchResponse = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(authorName)}&hl=${language}&results=1`);

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.profiles && searchData.profiles.length > 0) {
            targetAuthorId = searchData.profiles[0].author_id;
            console.log('Found author ID:', targetAuthorId);
          } else {
            console.warn('No profile found for author:', authorName);
            // TODO: Show a toast or notification that author was not found
            return;
          }
        } else {
          console.error('Failed to search for author profile');
          return;
        }
      }

      if (!targetAuthorId) return;

      // 1. Add placeholders immediately
      const graphWithPlaceholders = addResearcherPlaceholders(graphData, authorName, sourcePaperId, 20);
      setGraphData(graphWithPlaceholders);

      // 2. Fetch data
      const response = await fetch(`/api/scholar/author?user=${targetAuthorId}&hl=${language}&results=20&sortby=pubdate`);

      if (!response.ok) {
        throw new Error('Failed to fetch author data for expansion');
      }

      const newAuthorData: ScholarAuthorResponse = await response.json();

      // Sort articles by year in descending order
      if (newAuthorData.articles) {
        newAuthorData.articles.sort((a, b) => {
          const yearA = a.year ? parseInt(String(a.year), 10) : 0;
          const yearB = b.year ? parseInt(String(b.year), 10) : 0;
          return yearB - yearA;
        });
      }

      // 3. Update placeholders with real data
      const finalGraph = updateResearcherPapers(graphWithPlaceholders, newAuthorData, authorName);
      setGraphData(finalGraph);

    } catch (error) {
      console.error('Error expanding researcher:', error);
    }
  }, [graphData, language]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);

    // Handle different node types
    if (node.type === 'paper') {
      // Fetch full author names using view_citation endpoint
      if (node.metadata?.citation_id && userId) {
        const citationId = node.metadata.citation_id;

        // Check if we already have this data cached
        if (citationCache.current.has(citationId)) {
          const cachedData = citationCache.current.get(citationId);
          updateNodeWithCitationData(node, cachedData);
          return;
        }

        // Check if there's already a pending request for this citation
        if (pendingRequests.current.has(citationId)) {
          try {
            const citationData = await pendingRequests.current.get(citationId);
            updateNodeWithCitationData(node, citationData);
          } catch (error) {
            console.error('Error waiting for pending citation request:', error);
          }
          return;
        }

        // If not cached and not pending, fetch from API
        const fetchPromise = (async () => {
          try {
            const response = await fetch(
              `/api/scholar/author?user=${userId}&view_op=view_citation&citation_id=${citationId}&hl=${language}`
            );

            if (response.ok) {
              const citationData = await response.json();

              // Cache the response
              citationCache.current.set(citationId, citationData);

              return citationData;
            } else {
              console.error('Failed to fetch citation data:', response.status);
              throw new Error('Failed to fetch citation data');
            }
          } catch (error) {
            console.error('Error fetching full author names:', error);
            throw error;
          } finally {
            // Remove from pending requests
            pendingRequests.current.delete(citationId);
          }
        })();

        // Store the pending request
        pendingRequests.current.set(citationId, fetchPromise);

        try {
          const citationData = await fetchPromise;
          updateNodeWithCitationData(node, citationData);
        } catch (error) {
          // Error already logged above
        }
      }
    } else if (node.type === 'coauthor' && node.metadata?.authorId) {
      // Navigate to co-author's profile
      window.location.href = `/citations?user=${node.metadata.authorId}&hl=${language}`;
    }
  }, [userId, language, updateNodeWithCitationData]);

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
      <header className="bg-gradient-to-r from-[#8da9c4] to-[#d1dde7] border-b border-[#134074] px-3 md:px-6 py-2 md:py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-3 md:gap-6">
            {/* Home Button with Logo */}
            <a
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="text-base md:text-xl font-bold text-[#0b2545]">
                Scholar<span className="text-[#134074]">Capital</span>
              </div>
            </a>

            {/* Divider */}
            <div className="h-4 md:h-6 w-px bg-[#134074]"></div>

            {/* Author Info */}
            {authorData.author && (
              <div>
                <h1 className="text-base md:text-xl font-bold text-[#0b2545]">
                  {authorData.author.name}
                </h1>
                {authorData.author.affiliations && (
                  <p className="text-xs md:text-sm text-[#13315c] mt-0.5 md:mt-1">
                    {authorData.author.affiliations}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-xs md:text-base">
            {/* Citation stats */}
            {authorData.cited_by && authorData.cited_by.table?.[0] && (
              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-[#13315c]">Total Citations</div>
                <div className="text-base md:text-xl font-bold text-[#134074]">
                  {authorData.cited_by.table[0].citations?.all.toLocaleString()}
                </div>
              </div>
            )}

            {/* H-index */}
            {authorData.cited_by && authorData.cited_by.table?.[1] && (
              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-[#13315c]">h-index</div>
                <div className="text-base md:text-xl font-bold text-[#0b2545]">
                  {authorData.cited_by.table[1].h_index?.all}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Control Panel */}
      <div className="bg-white border-b border-[#8da9c4] px-3 md:px-6 py-2 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-xs md:text-sm text-[#13315c]">
            Showing {Math.min(visiblePapers, (authorData.articles || []).length)} recent papers
          </span>

          {visiblePapers < (authorData.articles || []).length && (
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadMorePapers(visiblePapers + 20)}
                className="px-2 md:px-3 py-1 text-xs md:text-sm bg-[#134074] text-white rounded hover:bg-[#0b2545] transition-colors"
              >
                +20 more
              </button>
              <button
                onClick={() => handleLoadMorePapers((authorData.articles || []).length)}
                className="px-2 md:px-3 py-1 text-xs md:text-sm bg-[#13315c] text-white rounded hover:bg-[#0b2545] transition-colors"
              >
                All ({(authorData.articles || []).length})
              </button>
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="text-xs md:text-sm truncate">
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
          onAuthorClick={fetchAuthorProfile}
          onExpandResearcher={handleExpandResearcher}
          authorProfiles={authorProfiles}
          language={language}
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

