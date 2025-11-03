// SearchAPI Google Scholar Types
// Documentation: https://www.searchapi.io/docs/google-scholar

// Common metadata returned by SearchAPI
export interface SearchMetadata {
  id: string;
  status: string;
  created_at: string;
  request_time_taken: number;
  parsing_time_taken: number;
  total_time_taken: number;
  request_url: string;
  html_url: string;
  json_url: string;
}

// Article/Paper structure from SearchAPI
export interface ScholarArticle {
  position?: number;
  title: string;
  title_link?: string;
  data_cid?: string;
  link?: string;
  publication?: string;
  snippet?: string;
  authors?: string | Array<{
    name: string;
    id?: string;
    author_id?: string;
    link?: string;
  }>;
  year?: string | number;
  cited_by?: {
    value?: string;
    total?: number;
    link?: string;
    cites_id?: string;
  };
  inline_links?: {
    serpapi_cite_link?: string;
    cited_by?: {
      cites_id: string;
      total: number;
      link: string;
    };
    versions?: {
      total: number;
      link: string;
      cluster_id: string;
    };
    related_articles_link?: string;
    cached_page_link?: string;
  };
  resource?: {
    name: string;
    format: string;
    link: string;
  };
  // Legacy fields for backward compatibility
  id?: string;
  citation_id?: string;
}

// Author profile structure from SearchAPI
export interface ScholarAuthor {
  name: string;
  affiliations?: string;
  university?: string;
  university_authors_link?: string;
  email?: string;
  interests?: Array<{
    title: string;
    link: string;
  }>;
  thumbnail?: string;
  author_id?: string;
}

// Citation statistics and histogram
export interface CitedByData {
  table?: Array<{
    citations?: {
      all: number;
      since_2019?: number;
    };
    h_index?: {
      all: number;
      since_2019?: number;
    };
    i10_index?: {
      all: number;
      since_2019?: number;
    };
  }>;
  histogram?: Array<{
    year: number;
    cites: number;
  }>;
  // Legacy format for backward compatibility
  graph?: Array<{
    year: string;
    citations: string;
  }>;
}

// Author profile API response
export interface ScholarAuthorResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: {
    engine: string;
    author_id?: string;
    hl?: string;
    [key: string]: string | undefined;
  };
  author: ScholarAuthor;
  articles: ScholarArticle[];
  cited_by?: CitedByData;
  public_access?: {
    link: string;
    available: number | string;
    not_available: number | string;
  };
  co_authors?: Array<{
    author_id: string;
    name: string;
    link: string;
    affiliations?: string;
    email?: string;
    thumbnail?: string;
  }>;
  pagination?: {
    current?: number;
    next?: string;
    other_pages?: Record<string, string>;
  };
}

// Profile search results (from profiles API or author: search)
export interface ScholarProfilesResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: {
    engine: string;
    q?: string;
    mauthors?: string;
    hl?: string;
  };
  profiles?: Array<{
    author_id: string;
    name: string;
    link: string;
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
  }>;
  // For backward compatibility with author: search results
  organic_results?: ScholarArticle[];
  pagination?: {
    current?: number;
    next?: string;
    other_pages?: Record<string, string>;
  };
}

// Citation formats API response
export interface ScholarCiteResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: {
    engine: string;
    data_cid: string;
    hl?: string;
  };
  citations: Array<{
    title: string;
    snippet: string;
  }>;
  links: Array<{
    title: string;
    link: string;
  }>;
}

// Search results API response
export interface ScholarSearchResponse {
  search_metadata?: SearchMetadata;
  search_parameters?: {
    engine: string;
    q?: string;
    hl?: string;
    [key: string]: string | number | undefined;
  };
  search_information?: {
    query_displayed?: string;
    total_results?: number;
    page?: number;
    time_taken_displayed?: number;
  };
  organic_results?: ScholarArticle[];
  related_searches?: Array<{
    query: string;
    highlighted?: string[];
    link: string;
  }>;
  profiles?: Array<{
    author_id: string;
    name: string;
    link: string;
    affiliations?: string;
    email?: string;
    cited_by?: {
      total: number;
    };
    thumbnail?: string;
  }>;
  organizations?: Array<{
    org_id: string;
    name: string;
    link: string;
    university?: string;
  }>;
  pagination?: {
    current: number;
    next?: string;
    other_pages?: Record<string, string>;
  };
  // Legacy fields for backward compatibility
  scholar_results?: ScholarArticle[];
}

