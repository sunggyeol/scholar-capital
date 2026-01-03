// SerpApi Google Scholar client
// Documentation: https://serpapi.com/google-scholar-api

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

interface SerpApiParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: SerpApiParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * Make a request to SerpApi
 */
async function makeSerpApiRequest(params: SerpApiParams) {
  const apiKey = process.env.SERPAPI_API_KEY;
  
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY is not configured');
  }
  
  // Add API key to params
  const requestParams = {
    ...params,
    api_key: apiKey,
  };
  
  const url = `${SERPAPI_BASE_URL}?${buildQueryString(requestParams)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SerpApi Error:', response.status, response.statusText, errorText);
    throw new Error(`SerpApi error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Search for articles on Google Scholar
 * Engine: google_scholar
 * Docs: https://serpapi.com/google-scholar-api
 */
export async function searchArticles(
  query: string,
  options: {
    num?: number;           // Number of results (default: 10, max: 20)
    start?: number;         // Result offset for pagination
    hl?: string;            // Language (default: 'en')
    as_ylo?: string;        // Starting year
    as_yhi?: string;        // Ending year
    scisbd?: number;        // Sort by date (0=relevance, 1=date)
    cites?: string;         // Citation ID for "Cited By" search
    cluster?: string;       // Cluster ID for article versions
    as_vis?: number;        // Include/exclude citations (0=include, 1=exclude)
    as_sdt?: string;        // Patent/case law filter
    safe?: string;          // Safe search ('active' or 'off')
    filter?: number;        // Duplicate filter (0=off, 1=on)
    lr?: string;            // Language restriction
  } = {}
) {
  const params: SerpApiParams = {
    engine: 'google_scholar',
    q: query,
    num: options.num || 10,
    hl: options.hl || 'en',
  };
  
  // Add optional parameters
  if (options.start !== undefined) params.start = options.start;
  if (options.as_ylo) params.as_ylo = options.as_ylo;
  if (options.as_yhi) params.as_yhi = options.as_yhi;
  if (options.scisbd !== undefined) params.scisbd = options.scisbd;
  if (options.cites) params.cites = options.cites;
  if (options.cluster) params.cluster = options.cluster;
  if (options.as_vis !== undefined) params.as_vis = options.as_vis;
  if (options.as_sdt) params.as_sdt = options.as_sdt;
  if (options.safe) params.safe = options.safe;
  if (options.filter !== undefined) params.filter = options.filter;
  if (options.lr) params.lr = options.lr;
  
  return makeSerpApiRequest(params);
}

/**
 * Fetch author profile data
 * Engine: google_scholar_author
 * Docs: https://serpapi.com/google-scholar-author-api
 */
export async function fetchAuthorProfile(
  authorId: string,
  options: {
    hl?: string;                                          // Language
    start?: number;                                       // Pagination offset for articles
    num?: number;                                         // Number of articles
    sort?: 'pubdate' | 'citedby';                        // Sort order
    view_op?: 'view_citation' | 'list_colleagues';       // View operation
    citation_id?: string;                                 // For view_citation
  } = {}
) {
  const params: SerpApiParams = {
    engine: 'google_scholar_author',
    author_id: authorId,
    hl: options.hl || 'en',
  };
  
  // Add optional parameters
  if (options.start !== undefined) params.start = options.start;
  if (options.num !== undefined) params.num = options.num;
  if (options.sort) params.sort = options.sort;
  if (options.view_op) params.view_op = options.view_op;
  if (options.citation_id) params.citation_id = options.citation_id;
  
  return makeSerpApiRequest(params);
}

/**
 * Search for author profiles using Google Scholar API with author: helper
 * Engine: google_scholar
 * Note: google_scholar_profiles is discontinued, using author: query helper instead
 * Docs: https://serpapi.com/google-scholar-api
 */
export async function searchProfiles(
  authorName: string,
  options: {
    hl?: string;            // Language
    num?: number;           // Number of results
    start?: number;         // Pagination offset
  } = {}
) {
  // Use the author: helper in the query to search for author profiles
  const params: SerpApiParams = {
    engine: 'google_scholar',
    q: `author:"${authorName}"`,
    hl: options.hl || 'en',
    num: options.num || 10,
  };
  
  // Add optional parameters
  if (options.start !== undefined) params.start = options.start;
  
  return makeSerpApiRequest(params);
}

/**
 * Get citation formats for an article
 * Engine: google_scholar_cite
 * Docs: https://serpapi.com/google-scholar-cite-api
 */
export async function getCitations(
  dataCid: string,
  hl: string = 'en'
) {
  const params: SerpApiParams = {
    engine: 'google_scholar_cite',
    q: dataCid,
    hl,
  };
  
  return makeSerpApiRequest(params);
}

/**
 * Get citation details for a specific citation
 * Uses google_scholar_author engine with view_op=view_citation
 * Docs: https://serpapi.com/google-scholar-author-citation
 */
export async function getCitationDetails(
  citationId: string,
  authorId: string,
  hl: string = 'en'
) {
  const params: SerpApiParams = {
    engine: 'google_scholar_author',
    author_id: authorId,
    citation_id: citationId,
    view_op: 'view_citation',
    hl,
  };
  
  return makeSerpApiRequest(params);
}

/**
 * Get cited by data for an author
 * Uses google_scholar_author engine
 * Docs: https://serpapi.com/google-scholar-author-cited-by
 */
export async function getAuthorCitedBy(
  authorId: string,
  hl: string = 'en'
) {
  return fetchAuthorProfile(authorId, { hl });
}

/**
 * List co-authors/colleagues
 * Uses google_scholar_author engine with view_op=list_colleagues
 * Docs: https://serpapi.com/google-scholar-author-co-authors
 */
export async function listColleagues(
  authorId: string,
  hl: string = 'en'
) {
  const params: SerpApiParams = {
    engine: 'google_scholar_author',
    author_id: authorId,
    view_op: 'list_colleagues',
    hl,
  };
  
  return makeSerpApiRequest(params);
}

/**
 * Get citing articles
 * Uses google_scholar engine with cites parameter
 */
export async function getCitingArticles(
  citesId: string,
  options: {
    q?: string;             // Optional query to search within citing articles
    start?: number;         // Pagination offset
    num?: number;           // Number of results
    hl?: string;            // Language
  } = {}
) {
  const params: SerpApiParams = {
    engine: 'google_scholar',
    cites: citesId,
    hl: options.hl || 'en',
  };
  
  if (options.q) params.q = options.q;
  if (options.start !== undefined) params.start = options.start;
  if (options.num !== undefined) params.num = options.num;
  
  return makeSerpApiRequest(params);
}

/**
 * Get cluster results (article versions)
 * Uses google_scholar engine with cluster parameter
 */
export async function getClusterResults(
  clusterId: string,
  options: {
    start?: number;
    num?: number;
    hl?: string;
  } = {}
) {
  const params: SerpApiParams = {
    engine: 'google_scholar',
    cluster: clusterId,
    hl: options.hl || 'en',
  };
  
  if (options.start !== undefined) params.start = options.start;
  if (options.num !== undefined) params.num = options.num;
  
  return makeSerpApiRequest(params);
}

