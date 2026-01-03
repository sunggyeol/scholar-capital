'use client';

import { useState } from 'react';
import { ProfileSearchResults } from '@/components/search/ProfileSearchResults';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Profile result interface matching what ProfileSearchResults expects
interface ProfileResult {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  email?: string;
  thumbnail?: string;
  cited_by?: { total: number };
  interests?: Array<{ title: string; link: string }>;
}

interface SearchState {
  profiles: ProfileResult[];
  hasMore: boolean;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use SerpApi's Google Scholar API with author: query helper
      const response = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for researchers');
      }

      const data = await response.json();
      
      const authorsMap = new Map<string, ProfileResult>();
      
      // PRIORITY 1: Check for top-level profiles object (direct author profile results)
      // SerpApi returns this when searching with author:"name"
      if (data.profiles?.authors && Array.isArray(data.profiles.authors)) {
        for (const author of data.profiles.authors) {
          if (author.author_id && !authorsMap.has(author.author_id)) {
            authorsMap.set(author.author_id, {
              name: author.name,
              author_id: author.author_id,
              link: author.link || `https://scholar.google.com/citations?user=${author.author_id}`,
              affiliations: author.affiliations,
              email: author.email,
              thumbnail: author.thumbnail,
              cited_by: typeof author.cited_by === 'number' 
                ? { total: author.cited_by } 
                : author.cited_by,
            });
          }
        }
      }
      
      // PRIORITY 2: Also extract authors from organic_results publication_info
      const organicResults = data.organic_results || [];
      
      for (const result of organicResults) {
        const authors = result.publication_info?.authors || [];
        
        for (const author of authors) {
          if (author.author_id && !authorsMap.has(author.author_id)) {
            // Check if author name matches search query (case insensitive)
            const authorNameLower = (author.name || '').toLowerCase();
            const queryLower = searchQuery.toLowerCase();
            const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 0);
            
            // Check if all query words appear in author name
            const isMatch = queryWords.every((word: string) => 
              authorNameLower.includes(word)
            );
            
            if (isMatch) {
              authorsMap.set(author.author_id, {
                name: author.name,
                author_id: author.author_id,
                link: author.link || `https://scholar.google.com/citations?user=${author.author_id}`,
              });
            }
          }
        }
      }
      
      const profiles = Array.from(authorsMap.values());
      
      setSearchResults({ 
        profiles, 
        hasMore: !!data.serpapi_pagination?.next 
      });
      
      if (profiles.length === 0) {
        setError(`No researchers found for "${searchQuery}". Try a different name or use the URL replacement method.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    // Pagination would need additional implementation
    return;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4ed] via-white to-[#d1dde7] flex items-center md:items-center justify-center px-4 pt-8 md:pt-0">
      <div className="w-full max-w-3xl">
        {/* Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-[#0b2545] mb-2 font-serif">
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
          <div className="mt-8">
            <LoadingSpinner message="Searching for researchers..." />
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="mt-8">
            <ProfileSearchResults
              results={searchResults.profiles}
              query={searchQuery}
              onLoadMore={handleLoadMore}
              hasMore={searchResults.hasMore}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
