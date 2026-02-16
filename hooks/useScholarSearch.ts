'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ProfileResult {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  cited_by?: number;
  works_count?: number;
  thumbnail?: string;
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

      // OpenAlex returns profiles directly in data.profiles.authors
      const profiles: ProfileResult[] = [];
      if (data.profiles?.authors && Array.isArray(data.profiles.authors)) {
        for (const author of data.profiles.authors) {
          if (author.author_id) {
            profiles.push({
              name: author.name,
              author_id: author.author_id,
              link: author.link || `https://openalex.org/authors/${author.author_id}`,
              affiliations: author.affiliations,
              cited_by: author.cited_by,
              works_count: author.works_count,
              thumbnail: author.thumbnail,
            });
          }
        }
      }

      setSearchResults({ profiles, hasMore: data.has_more || false });
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
    router.push(`/citations?user=${authorId}`);
  };

  const searchFor = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/scholar/profiles?mauthors=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for researchers');
      }
      const data = await response.json();

      const profiles: ProfileResult[] = [];
      if (data.profiles?.authors && Array.isArray(data.profiles.authors)) {
        for (const author of data.profiles.authors) {
          if (author.author_id) {
            profiles.push({
              name: author.name,
              author_id: author.author_id,
              link: author.link || `https://openalex.org/authors/${author.author_id}`,
              affiliations: author.affiliations,
              cited_by: author.cited_by,
              works_count: author.works_count,
              thumbnail: author.thumbnail,
            });
          }
        }
      }

      setSearchResults({ profiles, hasMore: data.has_more || false });
      if (profiles.length === 0) {
        setError(`No researchers found for "${query}". Try a different name.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  return { searchQuery, setSearchQuery, searchResults, loading, error, handleSearch, navigateToProfile, searchFor };
}
