'use client';

import { useScholarSearch } from '@/hooks/useScholarSearch';

// Fixed network nodes (deterministic — no hydration issues)
const NODES = [
  // Central cluster
  { cx: 720, cy: 360, r: 7, group: 'a' },
  { cx: 660, cy: 310, r: 4.5, group: 'a' },
  { cx: 780, cy: 320, r: 4.5, group: 'a' },
  { cx: 690, cy: 420, r: 4, group: 'a' },
  { cx: 750, cy: 410, r: 4, group: 'a' },
  { cx: 640, cy: 380, r: 3, group: 'a' },
  { cx: 800, cy: 380, r: 3, group: 'a' },

  // Left cluster
  { cx: 420, cy: 280, r: 5.5, group: 'b' },
  { cx: 370, cy: 240, r: 3.5, group: 'b' },
  { cx: 460, cy: 240, r: 3, group: 'b' },
  { cx: 390, cy: 320, r: 3, group: 'b' },

  // Right cluster
  { cx: 1020, cy: 400, r: 5, group: 'c' },
  { cx: 970, cy: 360, r: 3.5, group: 'c' },
  { cx: 1070, cy: 370, r: 3, group: 'c' },
  { cx: 1040, cy: 450, r: 3, group: 'c' },

  // Outliers
  { cx: 260, cy: 200, r: 3, group: 'd' },
  { cx: 300, cy: 460, r: 2.5, group: 'd' },
  { cx: 1160, cy: 320, r: 2.5, group: 'd' },
  { cx: 550, cy: 480, r: 2.5, group: 'd' },
  { cx: 880, cy: 260, r: 2.5, group: 'd' },
];

// Edges as index pairs
const EDGES: [number, number][] = [
  // Central cluster internal
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 5], [2, 6], [3, 4],
  // Left cluster internal
  [7, 8], [7, 9], [7, 10],
  // Right cluster internal
  [11, 12], [11, 13], [11, 14],
  // Cross-cluster
  [1, 7], [5, 10], [2, 11], [6, 12],
  // Outlier connections
  [8, 15], [10, 16], [13, 17], [3, 18], [2, 19],
];

const GROUP_COLORS: Record<string, string> = {
  a: '#134074',
  b: '#8da9c4',
  c: '#13315c',
  d: '#8da9c4',
};

export default function Home() {
  const { searchQuery, setSearchQuery, searchResults, loading, error, handleSearch, navigateToProfile, searchFor } = useScholarSearch();

  return (
    <>
      <style>{`
        @keyframes node-float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(2px, -3px); }
          66% { transform: translate(-2px, 2px); }
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .node-group {
          animation: node-float 6s ease-in-out infinite;
        }

        .fade-up { animation: fade-up 0.35s ease-out both; }

        .net-search {
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .net-search:focus-within {
          border-color: #134074;
          box-shadow: 0 4px 20px rgba(19, 64, 116, 0.1);
        }
      `}</style>

      <div className="min-h-screen bg-[#eef4ed] relative overflow-hidden">
        {/* Network graph background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Edges */}
          {EDGES.map(([from, to], i) => (
            <line
              key={`e-${i}`}
              x1={NODES[from].cx}
              y1={NODES[from].cy}
              x2={NODES[to].cx}
              y2={NODES[to].cy}
              stroke="#8da9c4"
              strokeWidth="0.8"
              opacity="0.4"
            />
          ))}

          {/* Nodes */}
          {NODES.map((node, i) => (
            <g key={`n-${i}`} className="node-group" style={{ animationDelay: `${i * -0.4}s`, animationDuration: `${5 + (i % 4)}s` }}>
              {/* Glow for larger nodes */}
              {node.r >= 5 && (
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r={node.r + 8}
                  fill={GROUP_COLORS[node.group]}
                  opacity="0.04"
                />
              )}
              <circle
                cx={node.cx}
                cy={node.cy}
                r={node.r}
                fill={GROUP_COLORS[node.group]}
                opacity={node.r >= 5 ? 0.5 : 0.3}
              />
            </g>
          ))}
        </svg>

        {/* Content overlay */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl text-center">
            {/* Title */}
            <p className="text-[11px] tracking-[0.3em] text-[#8da9c4] uppercase mb-3 font-medium">
              Academic Network Explorer
            </p>
            <h1
              className="text-4xl md:text-5xl text-[#0b2545] mb-3 leading-tight"
              style={{ fontWeight: 400 }}
            >
              Scholar Capital
            </h1>
            <p className="text-[#13315c] text-[15px] mb-10 max-w-sm mx-auto" style={{ fontWeight: 400 }}>
              Search for any researcher to map their papers, co-authors, and citations as a network.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="net-search flex items-center bg-white/90 backdrop-blur-sm border border-[#8da9c4] rounded-xl shadow-sm">
                <div className="pl-4 text-[#8da9c4]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by researcher name..."
                  className="flex-1 bg-transparent text-[#0b2545] placeholder-[#8da9c4] px-3 py-3.5 text-[15px] outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mr-1.5 px-5 py-2 bg-[#134074] hover:bg-[#0b2545] text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Searching' : 'Search'}
                </button>
              </div>
            </form>

            {/* Powered by OpenAlex */}
            <p className="text-[#8da9c4] text-[11px] mt-4">
              Powered by <a href="https://openalex.org" target="_blank" rel="noopener noreferrer" className="text-[#134074] hover:underline">OpenAlex</a> — the open catalog of scholarly works
            </p>

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                <p className="text-red-500 text-[13px]">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading && !searchResults && (
              <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-[#8da9c4]">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Searching...
              </div>
            )}

            {/* Results */}
            {searchResults && searchResults.profiles.length > 0 && (
              <div className="mt-8 text-left">
                <p className="text-[11px] text-[#8da9c4] font-medium mb-3 tracking-wide uppercase">
                  {searchResults.profiles.length} result{searchResults.profiles.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {searchResults.profiles.map((profile, i) => (
                    <div
                      key={profile.author_id}
                      onClick={() => navigateToProfile(profile.author_id)}
                      className="fade-up bg-white/80 backdrop-blur-sm border border-[#8da9c4]/40 rounded-xl p-4 cursor-pointer hover:border-[#134074]/25 hover:shadow-md transition-all group"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#134074]/8 flex items-center justify-center text-[#134074] text-[13px] font-semibold shrink-0">
                          {profile.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] text-[#0b2545] font-medium group-hover:text-[#134074] transition-colors truncate">
                            {profile.name}
                          </h3>
                          {profile.affiliations && (
                            <p className="text-[12px] text-[#8da9c4] truncate">{profile.affiliations}</p>
                          )}
                        </div>
                        {profile.cited_by !== undefined && (
                          <span className="text-[11px] text-[#8da9c4] tabular-nums shrink-0">
                            {profile.cited_by.toLocaleString()} cit.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demo link */}
            {!searchResults && !loading && (
              <div className="mt-12">
                <button
                  onClick={() => searchFor('Geoffrey Hinton')}
                  className="text-[#134074] text-[13px] font-medium hover:underline transition-colors"
                >
                  Try an example search &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
