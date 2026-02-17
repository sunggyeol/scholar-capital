// Scholar types for OpenAlex API
// Documentation: https://docs.openalex.org

// Author article/work structure (normalized from OpenAlex works)
export interface ScholarArticle {
  position?: number;
  title: string;
  result_id?: string;
  link?: string;
  snippet?: string;
  publication_info?: {
    summary?: string;
    authors?: Array<{
      name: string;
      author_id?: string;
      link?: string;
    }>;
  };
  // Legacy fields kept for backward compatibility with graph-transformer
  data_cid?: string;
  title_link?: string;
  authors?: string | Array<{
    name: string;
    id?: string;
    author_id?: string;
    link?: string;
  }>;
  year?: string | number;
  cited_by?: {
    value?: string | number;
    total?: number;
    link?: string;
    cites_id?: string;
  };
}

// Author profile structure
export interface ScholarAuthor {
  name: string;
  author_id?: string; // OpenAlex author ID (e.g., "A5023888391")
  affiliations?: string;
  email?: string;
  website?: string;
  interests?: Array<{
    title: string;
    link: string;
  }>;
  thumbnail?: string;
}

// Citation table structure
export interface CitedByTable {
  citations?: {
    all: number;
  };
  h_index?: {
    all: number;
  };
  i10_index?: {
    all: number;
  };
}

// Citation graph structure
export interface CitedByGraph {
  year: number;
  citations: number;
}

// Author article structure used in author profile response
export interface AuthorArticle {
  title: string;
  link?: string;
  citation_id?: string; // OpenAlex work ID (e.g., "W2741809807")
  authors?: string | Array<{
    name: string;
    id?: string;
    author_id?: string;
    link?: string;
  }>;
  publication?: string;
  cited_by?: {
    value?: string | number;
    total?: number;
    link?: string;
    cites_id?: string;
  };
  year?: string | number;
}

// Co-author structure
export interface CoAuthor {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  email?: string;
  thumbnail?: string;
}

// Author profile API response (normalized from OpenAlex)
export interface ScholarAuthorResponse {
  author?: ScholarAuthor;
  articles?: AuthorArticle[];
  cited_by?: {
    table?: CitedByTable[];
    graph?: CitedByGraph[];
  };
  co_authors?: CoAuthor[];
}

// Profile in search results
export interface ScholarProfile {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  email?: string;
  cited_by?: number;
  works_count?: number;
  thumbnail?: string;
  interests?: Array<{
    title: string;
    link: string;
  }>;
}

// Profile search API response
export interface ScholarProfilesResponse {
  profiles?: {
    authors?: ScholarProfile[];
  };
  has_more?: boolean;
}

// Search results API response
export interface ScholarSearchResponse {
  total_results?: number;
  page?: number;
  per_page?: number;
  results?: ScholarArticle[];
  has_more?: boolean;
}
