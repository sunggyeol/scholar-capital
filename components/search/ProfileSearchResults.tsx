'use client';

import { useRouter } from 'next/navigation';
import { LightBulbIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ProfileResult {
  name: string;
  link: string;
  author_id: string;
  affiliations?: string;
  email?: string;
  cited_by?: {
    total: number;
  };
  thumbnail?: string;
  interests?: Array<{
    title: string;
    link: string;
  }>;
}

interface ProfileSearchResultsProps {
  results: ProfileResult[];
  query: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function ProfileSearchResults({ 
  results, 
  query, 
  onLoadMore, 
  hasMore, 
  loading 
}: ProfileSearchResultsProps) {
  const router = useRouter();

  const handleProfileClick = (authorId: string) => {
    router.push(`/citations?user=${authorId}&hl=en`);
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12 max-w-2xl mx-auto">
        <svg 
          className="w-16 h-16 text-[#8da9c4] mx-auto mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h3 className="text-lg font-semibold text-[#0b2545] mb-2">No profiles found</h3>
        <p className="text-[#13315c] mb-6">
          The profile search has limited results for "{query}".
        </p>
        
        {/* Alternative Methods */}
        <div className="space-y-4">
          <div className="bg-[#8da9c4]/20 border border-[#134074] rounded-lg p-6 text-left">
            <h4 className="font-semibold text-[#0b2545] mb-2 flex items-center gap-2">
              <LightBulbIcon className="w-5 h-5" />
              Try These Instead:
            </h4>
            <div className="space-y-3 text-sm text-[#13315c]">
              <div>
                <p className="font-medium text-[#0b2545] mb-1">1. Use the Demo</p>
                <a 
                  href="/citations?user=Yua2oBoAAAAJ&hl=en"
                  className="text-[#134074] hover:text-[#0b2545] underline font-medium"
                >
                  View Demo Visualization →
                </a>
              </div>
              
              <div>
                <p className="font-medium text-[#0b2545] mb-1">2. Paste a Google Scholar URL</p>
                <p className="text-[#13315c] text-xs">
                  Go to Google Scholar, find a profile, and replace <code className="bg-white px-1 rounded border border-[#8da9c4]">scholar.google.com</code> with <code className="bg-[#134074] text-white px-1 rounded">scholar.capital</code>
                </p>
              </div>
              
              <div>
                <p className="font-medium text-[#0b2545] mb-1">3. Direct Author URL</p>
                <p className="text-[#13315c] text-xs">
                  If you know an author ID: <code className="bg-white px-1 rounded border border-[#8da9c4]">/citations?user=AUTHOR_ID</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#8da9c4]/20 border border-[#134074] rounded-lg p-4 mb-6">
        <p className="text-[#0b2545] text-sm font-medium flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          Found {results.length} researcher{results.length !== 1 ? 's' : ''} for "{query}". Click any researcher to visualize their network!
        </p>
      </div>

      {results.map((profile) => (
        <div
          key={profile.author_id}
          onClick={() => handleProfileClick(profile.author_id)}
          className="bg-white border-2 border-[#8da9c4] rounded-lg p-5 hover:shadow-xl hover:shadow-[#134074]/30 hover:border-[#134074] hover:scale-[1.02] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.thumbnail ? (
                <img
                  src={profile.thumbnail}
                  alt={profile.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#8da9c4] group-hover:border-[#134074] transition-colors"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#134074] to-[#13315c] flex items-center justify-center text-white text-xl font-bold group-hover:from-[#0b2545] group-hover:to-[#134074] transition-all">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-[#0b2545] group-hover:text-[#134074] transition-colors mb-1">
                {profile.name}
              </h3>
              
              {profile.affiliations && (
                <p className="text-sm text-[#13315c] mb-1">
                  {profile.affiliations}
                </p>
              )}

              {profile.cited_by !== undefined && (
                <p className="text-xs text-[#13315c]">
                  {profile.cited_by.total.toLocaleString()} citations
                </p>
              )}
            </div>

            {/* Arrow Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#134074] group-hover:bg-[#0b2545] flex items-center justify-center transition-all group-hover:scale-110">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

