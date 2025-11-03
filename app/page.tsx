'use client';

import { useState } from 'react';
import { ProfileSearchResults } from '@/components/search/ProfileSearchResults';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ScholarProfilesResponse } from '@/lib/types/scholar';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScholarProfilesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      // Use General Scholar API with author: prefix
      const response = await fetch(`/api/scholar/search?query=${encodeURIComponent(`author:${searchQuery}`)}&results=10`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for researchers');
      }

      const data: any = await response.json();
      
      // PRIORITY 1: Use direct profile results from SearchAPI if available
      if (data.profiles && data.profiles.length > 0) {
        // Map SearchAPI profiles to our expected format
        const profiles = data.profiles.map((profile: any) => ({
          name: profile.name,
          author_id: profile.author_id,
          link: profile.link,
          affiliations: profile.affiliations,
          email: profile.email,
          thumbnail: profile.thumbnail,
          cited_by: profile.cited_by
        }));
        
        setSearchResults({ profiles, pagination: {} });
        
        if (profiles.length === 0) {
          setError(`No researchers found for "${searchQuery}". Try a different name.`);
        }
        return; // Exit early, we have profiles
      }
      
      // PRIORITY 2: Fall back to extracting from papers if no direct profiles
      // Use organic_results OR scholar_results (fallback for compatibility)
      const results = data.scholar_results || data.organic_results || [];
      
      // Helper function to check if author name matches search query
      const matchesSearchQuery = (authorName: string, query: string): boolean => {
        if (!authorName || !query) return false;
        
        const normalizedAuthor = authorName.toLowerCase().replace(/[^a-z\s]/g, '');
        const normalizedQuery = query.toLowerCase().replace(/[^a-z\s]/g, '');
        
        // Split into words for flexible matching
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
        const authorWords = normalizedAuthor.split(/\s+/).filter(w => w.length > 0);
        
        // Check if all query words appear in author name (in any order)
        const allWordsMatch = queryWords.every(qWord => 
          authorWords.some(aWord => 
            aWord.includes(qWord) || qWord.includes(aWord)
          )
        );
        
        // Also check if query is a substring of author name
        const substringMatch = normalizedAuthor.includes(normalizedQuery);
        
        return allWordsMatch || substringMatch;
      };
      
      // Extract unique authors from paper results (ONLY those matching the search query)
      const authorsMap = new Map();
      if (results.length > 0) {
        for (const paper of results) {
          if (paper.authors) {
            // Handle both array and string formats
            const authorsList = Array.isArray(paper.authors) ? paper.authors : [];
            
            for (const author of authorsList) {
              const authorId = author.author_id || author.id;
              const authorName = author.name;
              
              // Only include authors whose names match the search query
              if (authorId && !authorsMap.has(authorId)) {
                const isMatch = matchesSearchQuery(authorName, searchQuery);
                
                if (isMatch) {
                  authorsMap.set(authorId, {
                    name: authorName,
                    author_id: authorId,
                    link: author.link,
                  });
                }
              }
            }
          }
        }
      }
      
      // Convert to profiles format
      const profiles = Array.from(authorsMap.values());
      
      setSearchResults({ profiles, pagination: {} });
      
      if (profiles.length === 0) {
        setError(`No researchers found for "${searchQuery}". Try a different name.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    // Not supported with general search approach
    return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ed] via-white to-[#d1dde7] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0b2545] mb-2 font-mono">
            Scholar<span className="text-[#134074]">Capital</span>
          </h1>
        </div>

        {/* Search Section */}
        <div className="w-full">
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for researchers..."
                  className="w-full px-4 py-3 pr-10 text-base bg-white border-2 border-[#8da9c4] text-[#0b2545] placeholder-[#13315c] rounded-xl focus:ring-2 focus:ring-[#134074] focus:border-[#134074] outline-none shadow-lg"
                  autoFocus
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#13315c]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#134074] text-white text-base font-semibold rounded-xl hover:bg-[#0b2545] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 text-red-700 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && !searchResults && (
          <div className="flex justify-center py-12">
            <LoadingSpinner message="Searching for researchers..." />
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="mt-8">
            <ProfileSearchResults
              results={searchResults.profiles || []}
              query={searchQuery}
              onLoadMore={handleLoadMore}
              hasMore={!!searchResults.pagination?.next}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
