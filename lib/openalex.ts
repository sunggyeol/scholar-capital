// OpenAlex API client
// Documentation: https://docs.openalex.org

const OPENALEX_BASE_URL = 'https://api.openalex.org';

interface OpenAlexParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Build query string from parameters
 */
function buildQueryString(params: OpenAlexParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Make a request to OpenAlex API with retry logic
 */
async function makeOpenAlexRequest(endpoint: string, params: OpenAlexParams = {}, maxRetries = 3) {
  const apiKey = process.env.OPENALEX_API_KEY;

  const requestParams: OpenAlexParams = { ...params };
  if (apiKey) {
    requestParams.api_key = apiKey;
  }

  const queryString = buildQueryString(requestParams);
  const url = `${OPENALEX_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return response.json();
      }

      // Rate limited or server error - retry with backoff
      if ((response.status === 403 || response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const errorText = await response.text();
      console.error('OpenAlex Error:', response.status, response.statusText, errorText);
      throw new Error(`OpenAlex error: ${response.status} ${response.statusText}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('OpenAlex error:')) {
        throw error;
      }
      // Network error - retry
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }

  throw new Error('OpenAlex request failed after retries');
}

/**
 * Extract short ID from OpenAlex URL
 * e.g., "https://openalex.org/A5023888391" → "A5023888391"
 */
export function extractId(openAlexUrl: string): string {
  if (openAlexUrl.startsWith('https://openalex.org/')) {
    return openAlexUrl.replace('https://openalex.org/', '');
  }
  return openAlexUrl;
}

/**
 * Search for authors by name
 */
export async function searchAuthors(
  query: string,
  options: {
    perPage?: number;
    page?: number;
  } = {}
) {
  return makeOpenAlexRequest('/authors', {
    search: query,
    'per-page': options.perPage || 10,
    page: options.page || 1,
  });
}

/**
 * Get a single author by OpenAlex ID
 */
export async function getAuthor(authorId: string) {
  return makeOpenAlexRequest(`/authors/${authorId}`);
}

/**
 * Get works by author ID
 */
export async function getAuthorWorks(
  authorId: string,
  options: {
    perPage?: number;
    page?: number;
    sort?: string;
  } = {}
) {
  // Ensure we use the short ID format for the filter
  const shortId = extractId(authorId);

  return makeOpenAlexRequest('/works', {
    filter: `authorships.author.id:${shortId}`,
    sort: options.sort || 'publication_year:desc',
    'per-page': options.perPage || 200,
    page: options.page || 1,
    select: 'id,title,publication_year,cited_by_count,authorships,primary_location,doi,type',
  });
}

/**
 * Search for works
 */
export async function searchWorks(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    filter?: string;
    sort?: string;
  } = {}
) {
  const params: OpenAlexParams = {
    search: query,
    'per-page': options.perPage || 25,
    page: options.page || 1,
    select: 'id,title,publication_year,cited_by_count,authorships,primary_location,doi,type',
  };

  if (options.filter) params.filter = options.filter;
  if (options.sort) params.sort = options.sort;

  return makeOpenAlexRequest('/works', params);
}

/**
 * Get a single work by OpenAlex ID
 */
export async function getWork(workId: string) {
  return makeOpenAlexRequest(`/works/${workId}`);
}
