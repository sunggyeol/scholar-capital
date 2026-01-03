// Google Scholar Types for SerpApi
// Documentation: https://serpapi.com/google-scholar-api

// Common metadata returned by SerpApi
export interface SearchMetadata {
  id: string;
  status: string;
  json_endpoint: string;
  created_at: string;
  processed_at: string;
  google_scholar_url?: string;
  raw_html_file: string;
  total_time_taken: number;
}

// Search parameters echoed back
export interface SearchParameters {
  engine: string;
  q?: string;
  hl?: string;
  start?: number;
  num?: number;
  as_ylo?: string;
  as_yhi?: string;
  scisbd?: number;
  author_id?: string;
  mauthors?: string;
  [key: string]: string | number | undefined;
}

// Article/Paper structure from SerpApi organic_results
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
  resources?: Array<{
    title: string;
    file_format?: string;
    link: string;
  }>;
  inline_links?: {
    serpapi_cite_link?: string;
    cited_by?: {
      total: number;
      link: string;
      cites_id: string;
      serpapi_scholar_link?: string;
    };
    related_pages_link?: string;
    serpapi_related_pages_link?: string;
    versions?: {
      total: number;
      link: string;
      cluster_id: string;
      serpapi_scholar_link?: string;
    };
    cached_page_link?: string;
  };
  // Legacy fields for backward compatibility
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

// Author profile structure from SerpApi
export interface ScholarAuthor {
  name: string;
  author_id?: string;
  affiliations?: string;
  email?: string;
  website?: string;
  interests?: Array<{
    title: string;
    serpapi_link?: string;
    link: string;
  }>;
  thumbnail?: string;
}

// Citation table structure
export interface CitedByTable {
  citations?: {
    all: number;
    since_2020?: number;
  };
  h_index?: {
    all: number;
    since_2020?: number;
  };
  i10_index?: {
    all: number;
    since_2020?: number;
  };
}

// Citation graph structure
export interface CitedByGraph {
  year: number;
  citations: number;
}

// Author article structure
export interface AuthorArticle {
  title: string;
  link?: string;
  citation_id?: string;
  authors?: string;
  publication?: string;
  cited_by?: {
    value?: string | number;
    total?: number;
    link?: string;
    serpapi_link?: string;
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

// Author profile API response
export interface ScholarAuthorResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: SearchParameters;
  author?: ScholarAuthor;
  articles?: AuthorArticle[];
  cited_by?: {
    table?: CitedByTable[];
    graph?: CitedByGraph[];
  };
  public_access?: {
    link: string;
    available: number;
    not_available: number;
  };
  co_authors?: CoAuthor[];
  serpapi_pagination?: {
    next?: string;
    next_link?: string;
  };
}

// Profile in search results
export interface ScholarProfile {
  name: string;
  author_id: string;
  link: string;
  affiliations?: string;
  email?: string;
  cited_by?: number;
  thumbnail?: string;
  interests?: Array<{
    title: string;
    link: string;
  }>;
}

// Profile search API response
export interface ScholarProfilesResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: SearchParameters;
  profiles?: ScholarProfile[];
  pagination?: {
    next?: string;
    next_link?: string;
  };
}

// Citation format
export interface CitationFormat {
  title: string;
  snippet: string;
}

// Citation link
export interface CitationLink {
  name: string;
  link: string;
}

// Citation formats API response
export interface ScholarCiteResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: SearchParameters;
  citations?: CitationFormat[];
  links?: CitationLink[];
}

// Search results API response
export interface ScholarSearchResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: SearchParameters;
  search_information?: {
    organic_results_state?: string;
    total_results?: number;
    time_taken_displayed?: number;
    query_displayed?: string;
  };
  organic_results?: ScholarArticle[];
  related_searches?: Array<{
    query: string;
    link: string;
  }>;
  profiles?: ScholarProfile[];
  pagination?: {
    current: number;
    next?: string;
    next_link?: string;
    other_pages?: Record<string, string>;
  };
  serpapi_pagination?: {
    current: number;
    next?: string;
    next_link?: string;
    other_pages?: Record<string, string>;
  };
}
