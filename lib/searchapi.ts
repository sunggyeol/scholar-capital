// SearchAPI utility functions for Google Scholar
// Documentation: https://www.searchapi.io/docs/google-scholar

const SEARCHAPI_BASE_URL = 'https://www.searchapi.io/api/v1/search';

interface SearchAPIParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: SearchAPIParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * Make a request to SearchAPI
 */
async function makeSearchAPIRequest(params: SearchAPIParams) {
  const apiKey = process.env.SEARCHAPI_API_KEY;
  
  if (!apiKey) {
    throw new Error('SEARCHAPI_API_KEY is not configured');
  }
  
  // Add API key to params
  const requestParams = {
    ...params,
    api_key: apiKey,
  };
  
  const url = `${SEARCHAPI_BASE_URL}?${buildQueryString(requestParams)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 86400 }, // Cache for 1 day
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('SearchAPI Error:', response.status, response.statusText, errorText);
    throw new Error(`SearchAPI error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  const jsonData = await response.json();
  return jsonData;
}

/**
 * Search for articles on Google Scholar
 * Engine: google_scholar
 */
export async function searchArticles(
  query: string,
  options: {
    results?: number;      // num parameter (default: 10, max: 20)
    page?: number;         // page parameter (default: 1)
    language?: string;     // hl parameter (default: 'en')
    asYlo?: string;        // as_ylo parameter (starting year)
    asYhi?: string;        // as_yhi parameter (ending year)
    cites?: string;        // cites parameter (citation ID)
    cluster?: string;      // cluster parameter (article versions)
    scisbd?: number;       // scisbd parameter (0=relevance, 1=date+abstracts, 2=date)
    asRr?: number;         // as_rr parameter (0=all, 1=review articles only)
    asVis?: number;        // as_vis parameter (0=with citations, 1=without citations)
    asSdt?: string;        // as_sdt parameter (patent/court filter)
    filter?: number;       // filter parameter (0=no filter, 1=duplicate filter)
    safe?: string;         // safe parameter ('active' or 'off')
    source?: string;       // source parameter (filter by source)
    lr?: string;           // lr parameter (language restriction)
  } = {}
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar',
    q: query,
    num: options.results || 10,
    page: options.page || 1,
    hl: options.language || 'en',
  };
  
  // Add optional parameters
  if (options.asYlo) params.as_ylo = options.asYlo;
  if (options.asYhi) params.as_yhi = options.asYhi;
  if (options.cites) params.cites = options.cites;
  if (options.cluster) params.cluster = options.cluster;
  if (options.scisbd !== undefined) params.scisbd = options.scisbd;
  if (options.asRr !== undefined) params.as_rr = options.asRr;
  if (options.asVis !== undefined) params.as_vis = options.asVis;
  if (options.asSdt) params.as_sdt = options.asSdt;
  if (options.filter !== undefined) params.filter = options.filter;
  if (options.safe) params.safe = options.safe;
  if (options.source) params.source = options.source;
  if (options.lr) params.lr = options.lr;
  
  return makeSearchAPIRequest(params);
}

/**
 * Fetch author profile data
 * Engine: google_scholar_author
 */
export async function fetchAuthorProfile(
  authorId: string,
  options: {
    results?: number;                                    // Not documented but assumed similar
    language?: string;                                   // hl parameter
    sortby?: 'pubdate' | 'title';                       // sortby parameter
    viewOp?: 'view_citation' | 'list_mandates' | 'view_mandate' | 'list_colleagues'; // view_op parameter
    citationId?: string;                                 // citation_id parameter
    agencyId?: string;                                   // agencyid parameter (for mandates)
    page?: number;                                       // page parameter (pagination)
  } = {}
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar_author',
    author_id: authorId,
    hl: options.language || 'en',
  };
  
  // Add optional parameters
  if (options.sortby) params.sortby = options.sortby;
  if (options.viewOp) params.view_op = options.viewOp;
  if (options.citationId) params.citation_id = options.citationId;
  if (options.agencyId) params.agencyid = options.agencyId;
  if (options.page) params.page = options.page;
  
  return makeSearchAPIRequest(params);
}

/**
 * Search for author profiles
 * Note: SearchAPI google_scholar engine can find profiles using "author:NAME" query
 */
export async function searchProfiles(
  authorName: string,
  options: {
    results?: number;
    page?: number;
    language?: string;
  } = {}
) {
  // Use the google_scholar engine with author: prefix to find profiles
  return searchArticles(`author:${authorName}`, {
    results: options.results || 10,
    page: options.page || 1,
    language: options.language || 'en',
  });
}

/**
 * Get citation formats for an article
 * Engine: google_scholar_cite
 */
export async function getCitations(
  dataCid: string,
  language: string = 'en'
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar_cite',
    data_cid: dataCid,
    hl: language,
  };
  
  return makeSearchAPIRequest(params);
}

/**
 * Get citation details for a specific citation
 * Uses google_scholar_author engine with view_op=view_citation
 */
export async function getCitationDetails(
  citationId: string,
  authorId?: string,
  language: string = 'en'
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar_author',
    citation_id: citationId,
    view_op: 'view_citation',
    hl: language,
  };
  
  // author_id is optional according to API docs
  if (authorId) {
    params.author_id = authorId;
  }
  
  return makeSearchAPIRequest(params);
}

/**
 * List author mandates
 * Uses google_scholar_author engine with view_op=list_mandates
 */
export async function listMandates(
  authorId: string,
  options: {
    agencyId?: string;
    page?: number;
    language?: string;
  } = {}
) {
  return fetchAuthorProfile(authorId, {
    viewOp: 'list_mandates',
    agencyId: options.agencyId,
    page: options.page,
    language: options.language || 'en',
  });
}

/**
 * Get mandate details
 * Uses google_scholar_author engine with view_op=view_mandate
 */
export async function getMandateDetails(
  citationId: string,
  authorId?: string,
  language: string = 'en'
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar_author',
    citation_id: citationId,
    view_op: 'view_mandate',
    hl: language,
  };
  
  if (authorId) {
    params.author_id = authorId;
  }
  
  return makeSearchAPIRequest(params);
}

/**
 * List co-authors/colleagues
 * Uses google_scholar_author engine with view_op=list_colleagues
 */
export async function listColleagues(
  authorId: string,
  language: string = 'en'
) {
  return fetchAuthorProfile(authorId, {
    viewOp: 'list_colleagues',
    language,
  });
}

/**
 * Get cluster results (article versions)
 * Uses google_scholar engine with cluster parameter
 */
export async function getClusterResults(
  clusterId: string,
  options: {
    page?: number;
    language?: string;
  } = {}
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar',
    cluster: clusterId,
    hl: options.language || 'en',
  };
  
  if (options.page) params.page = options.page;
  
  return makeSearchAPIRequest(params);
}

/**
 * Get citing articles
 * Uses google_scholar engine with cites parameter
 */
export async function getCitingArticles(
  citesId: string,
  options: {
    query?: string;        // Optional query to search within citing articles
    page?: number;
    language?: string;
  } = {}
) {
  const params: SearchAPIParams = {
    engine: 'google_scholar',
    cites: citesId,
    hl: options.language || 'en',
  };
  
  if (options.query) params.q = options.query;
  if (options.page) params.page = options.page;
  
  return makeSearchAPIRequest(params);
}

