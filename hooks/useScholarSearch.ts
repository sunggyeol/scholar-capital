'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ProfileResult {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  email?: string;
  thumbnail?: string;
  cited_by?: { total: number };
  interests?: Array<{ title: string; link: string }>;
}

export interface SearchState {
  profiles: ProfileResult[];
  hasMore: boolean;
}

export function useScholarSearch() {
  const router = useRouter();
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
      const response = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for researchers');
      }
      const data = await response.json();
      const authorsMap = new Map<string, ProfileResult>();

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
              cited_by: typeof author.cited_by === 'number' ? { total: author.cited_by } : author.cited_by,
              interests: author.interests,
            });
          }
        }
      }

      const organicResults = data.organic_results || [];
      for (const result of organicResults) {
        const authors = result.publication_info?.authors || [];
        for (const author of authors) {
          if (author.author_id && !authorsMap.has(author.author_id)) {
            const authorNameLower = (author.name || '').toLowerCase();
            const queryWords = searchQuery.toLowerCase().split(/\s+/).filter((w: string) => w.length > 0);
            if (queryWords.every((word: string) => authorNameLower.includes(word))) {
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
      setSearchResults({ profiles, hasMore: !!data.serpapi_pagination?.next });
      if (profiles.length === 0) {
        setError(`No researchers found for "${searchQuery}". Try a different name.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const navigateToProfile = (authorId: string) => {
    router.push(`/citations?user=${authorId}&hl=en`);
  };

  return { searchQuery, setSearchQuery, searchResults, loading, error, handleSearch, navigateToProfile };
}
