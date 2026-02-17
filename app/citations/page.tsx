'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScholarGraph } from '@/components/graph/ScholarGraph';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { transformAuthorToGraph, addMorePapers, addResearcherPlaceholders, updateResearcherPapers } from '@/lib/utils/graph-transformer';
import { GraphData, GraphNode } from '@/lib/types/graph';
import { ScholarAuthorResponse } from '@/lib/types/scholar';

function CitationsContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [authorData, setAuthorData] = useState<ScholarAuthorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePapers, setVisiblePapers] = useState(20);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [authorProfiles, setAuthorProfiles] = useState<Map<string, any>>(new Map());

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
      setError('Missing user ID in URL. Please provide a valid OpenAlex author ID.');
      setLoading(false);
      return;
    }

    fetchAuthorData();
  }, [userId]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/scholar/author?user=${userId}&sortby=pubdate`);

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
          return yearB - yearA;
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

  // Fetch author profile information
  const fetchAuthorProfile = useCallback(async (authorName: string, authorId?: string) => {
    if (authorProfiles.has(authorName)) {
      return authorProfiles.get(authorName);
    }

    if (pendingAuthorRequests.current.has(authorName)) {
      try {
        return await pendingAuthorRequests.current.get(authorName);
      } catch (error) {
        console.error('Error waiting for pending author request:', error);
        return null;
      }
    }

    const fetchPromise = (async () => {
      try {
        if (authorId) {
          const response = await fetch(`/api/scholar/author?user=${authorId}`);
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
          const response = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(authorName)}&results=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.profiles?.authors && data.profiles.authors.length > 0) {
              const profile = data.profiles.authors[0];
              return {
                name: profile.name,
                affiliations: profile.affiliations,
                cited_by: profile.cited_by,
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
  }, [authorProfiles]);

  const handleExpandResearcher = useCallback(async (authorName: string, authorId?: string, sourcePaperId?: string) => {
    if (!graphData) return;

    let targetAuthorId = authorId;

    try {
      // If no ID, search for the author first
      if (!targetAuthorId) {
        const searchResponse = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(authorName)}&results=1`);

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.profiles?.authors && searchData.profiles.authors.length > 0) {
            targetAuthorId = searchData.profiles.authors[0].author_id;
          } else {
            console.warn('No profile found for author:', authorName);
            return;
          }
        } else {
          console.error('Failed to search for author profile');
          return;
        }
      }

      if (!targetAuthorId) return;

      // Add placeholders immediately
      const graphWithPlaceholders = addResearcherPlaceholders(graphData, authorName, sourcePaperId, 20);
      setGraphData(graphWithPlaceholders);

      // Fetch data
      const response = await fetch(`/api/scholar/author?user=${targetAuthorId}&sortby=pubdate`);

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

      // Update placeholders with real data
      const finalGraph = updateResearcherPapers(graphWithPlaceholders, newAuthorData, authorName);
      setGraphData(finalGraph);

    } catch (error) {
      console.error('Error expanding researcher:', error);
    }
  }, [graphData]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    setSelectedNode(node);

    // With OpenAlex, full author data is already available from the initial fetch
    // No need for additional API calls on node click

    if (node.type === 'coauthor' && node.metadata?.authorId) {
      window.location.href = `/citations?user=${node.metadata.authorId}`;
    }
  }, []);

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
