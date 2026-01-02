// Custom Google Scholar API client
// API Documentation: https://soon-casa-updated-western.trycloudflare.com/openapi.json

import {
  transformSearchResponse,
  transformAuthorResponse,
  transformProfilesResponse,
  transformCitationsResponse,
} from './transformers/custom-api-transformer';

const CUSTOM_API_TIMEOUT = 90000; // 90 seconds

/**
 * Custom API error class
 */
export class CustomAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'CustomAPIError';
  }
}

/**
 * Custom API response wrapper
 */
interface CustomAPIResponse<T> {
  success: boolean;
  message?: string;
  cache_hit?: boolean;
  data: T;
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = CUSTOM_API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new CustomAPIError('Request timeout', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Make a POST request to Custom API
 */
async function makeCustomAPIPostRequest<T>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  const baseUrl = process.env.CUSTOM_API_BASE_URL;

  if (!baseUrl) {
    throw new CustomAPIError('CUSTOM_API_BASE_URL is not configured');
  }

  const url = `${baseUrl}${endpoint}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Custom API Error:', response.status, response.statusText, errorText);
    throw new CustomAPIError(
      `Custom API error: ${response.status} ${response.statusText}`,
      response.status,
      errorText
    );
  }

  const jsonData: CustomAPIResponse<T> = await response.json();

  // Unwrap the response
  if (!jsonData.success) {
    throw new CustomAPIError(jsonData.message || 'API request failed');
  }

  return jsonData.data;
}

/**
 * Make a GET request to Custom API
 */
async function makeCustomAPIGetRequest<T>(
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<T> {
  const baseUrl = process.env.CUSTOM_API_BASE_URL;

  if (!baseUrl) {
    throw new CustomAPIError('CUSTOM_API_BASE_URL is not configured');
  }

  let url = `${baseUrl}${endpoint}`;

  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    url += `?${searchParams.toString()}`;
  }

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Custom API Error:', response.status, response.statusText, errorText);
    throw new CustomAPIError(
      `Custom API error: ${response.status} ${response.statusText}`,
      response.status,
      errorText
    );
  }

  const jsonData: CustomAPIResponse<T> = await response.json();

  // Unwrap the response
  if (!jsonData.success) {
    throw new CustomAPIError(jsonData.message || 'API request failed');
  }

  return jsonData.data;
}

/**
 * Search for articles on Google Scholar
 * POST /api/v1/search/scholar
 */
export async function searchArticles(
  query: string,
  options: {
    results?: number;      // num_results parameter (default: 10)
    page?: number;         // converted to start parameter
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
  const numResults = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * numResults;

  const body: Record<string, any> = {
    q: query,
    num_results: numResults,
    start,
    hl: options.language || 'en',
  };

  // Add optional parameters
  if (options.asYlo) body.as_ylo = options.asYlo;
  if (options.asYhi) body.as_yhi = options.asYhi;

  // Map scisbd to sort (scisbd=2 means sort by date)
  if (options.scisbd === 2) {
    body.sort = 1; // Sort by date
  }

  // Note: Custom API doesn't support all SearchAPI parameters
  // These will be ignored: cites, cluster, asRr, asVis, asSdt, filter, safe, source, lr
  // When these are needed, the fallback to SearchAPI will be used

  const response = await makeCustomAPIPostRequest('/api/v1/search/scholar', body);
  return transformSearchResponse(response);
}

/**
 * Fetch author profile data
 * GET /api/v1/author/{authorId}
 */
export async function fetchAuthorProfile(
  authorId: string,
  options: {
    results?: number;
    language?: string;
    sortby?: 'pubdate' | 'title';
    viewOp?: 'view_citation' | 'list_mandates' | 'view_mandate' | 'list_colleagues';
    citationId?: string;
    agencyId?: string;
    page?: number;
  } = {}
) {
  const queryParams: Record<string, string> = {};

  if (options.language) {
    queryParams.hl = options.language;
  }

  // Note: Custom API doesn't support view_op, sortby, etc.
  // These advanced features will be handled by SearchAPI fallback

  const response = await makeCustomAPIGetRequest(`/api/v1/author/${authorId}`, queryParams);
  return transformAuthorResponse(response);
}

/**
 * Search for author profiles
 * POST /api/v1/search/profiles
 */
export async function searchProfiles(
  authorName: string,
  options: {
    results?: number;
    page?: number;
    language?: string;
  } = {}
) {
  const numResults = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * numResults;

  const body = {
    q: authorName,
    num_results: numResults,
    start,
    hl: options.language || 'en',
  };

  const response = await makeCustomAPIPostRequest('/api/v1/search/profiles', body);
  return transformProfilesResponse(response);
}

/**
 * Get citation formats for an article
 * GET /api/v1/cite/{citeId}
 */
export async function getCitations(
  citeId: string,
  language: string = 'en'
) {
  const queryParams: Record<string, string> = {
    hl: language,
  };

  const response = await makeCustomAPIGetRequest(`/api/v1/cite/${citeId}`, queryParams);
  return transformCitationsResponse(response);
}
