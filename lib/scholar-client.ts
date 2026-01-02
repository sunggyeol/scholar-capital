// Unified Google Scholar client with automatic fallback
// Primary: Custom API, Fallback: SearchAPI

import * as customapi from './customapi';
import * as searchapi from './searchapi';
import { CustomAPIError } from './customapi';

/**
 * Helper function to log fallback events
 */
function logFallback(endpoint: string, error: Error, additionalContext?: Record<string, any>) {
  console.warn('[FALLBACK] Custom API failed, using SearchAPI', {
    endpoint,
    error: error.message,
    ...additionalContext,
  });
}

/**
 * Helper function to log when both APIs fail
 */
function logBothAPIsFailed(
  endpoint: string,
  customError: Error,
  searchapiError: Error,
  additionalContext?: Record<string, any>
) {
  console.error('[API ERROR] Both Custom API and SearchAPI failed', {
    endpoint,
    customAPIError: customError.message,
    searchAPIError: searchapiError.message,
    ...additionalContext,
  });
}

/**
 * Search for articles on Google Scholar
 * Tries Custom API first, falls back to SearchAPI on error
 */
export async function searchArticles(
  query: string,
  options: {
    results?: number;
    page?: number;
    language?: string;
    asYlo?: string;
    asYhi?: string;
    cites?: string;
    cluster?: string;
    scisbd?: number;
    asRr?: number;
    asVis?: number;
    asSdt?: string;
    filter?: number;
    safe?: string;
    source?: string;
    lr?: string;
  } = {}
) {
  try {
    // Try custom API first
    const result = await customapi.searchArticles(query, options);
    return result;
  } catch (error) {
    // Log fallback event
    logFallback('searchArticles', error as Error, { query });

    // Fallback to SearchAPI
    try {
      return await searchapi.searchArticles(query, options);
    } catch (fallbackError) {
      logBothAPIsFailed('searchArticles', error as Error, fallbackError as Error, { query });
      throw fallbackError;
    }
  }
}

/**
 * Fetch author profile data
 * Tries Custom API first, falls back to SearchAPI on error
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
  // If using advanced view operations, go directly to SearchAPI
  // Custom API doesn't support these features
  if (options.viewOp) {
    return searchapi.fetchAuthorProfile(authorId, options);
  }

  try {
    // Try custom API first for basic author profile
    const result = await customapi.fetchAuthorProfile(authorId, options);
    return result;
  } catch (error) {
    // Log fallback event
    logFallback('fetchAuthorProfile', error as Error, { authorId });

    // Fallback to SearchAPI
    try {
      return await searchapi.fetchAuthorProfile(authorId, options);
    } catch (fallbackError) {
      logBothAPIsFailed('fetchAuthorProfile', error as Error, fallbackError as Error, { authorId });
      throw fallbackError;
    }
  }
}

/**
 * Search for author profiles
 * Tries Custom API first, falls back to SearchAPI on error
 */
export async function searchProfiles(
  authorName: string,
  options: {
    results?: number;
    page?: number;
    language?: string;
  } = {}
) {
  try {
    // Try custom API first
    const result = await customapi.searchProfiles(authorName, options);
    return result;
  } catch (error) {
    // Log fallback event
    logFallback('searchProfiles', error as Error, { authorName });

    // Fallback to SearchAPI
    try {
      return await searchapi.searchProfiles(authorName, options);
    } catch (fallbackError) {
      logBothAPIsFailed('searchProfiles', error as Error, fallbackError as Error, { authorName });
      throw fallbackError;
    }
  }
}

/**
 * Get citation formats for an article
 * Tries Custom API first, falls back to SearchAPI on error
 */
export async function getCitations(
  citeId: string,
  language: string = 'en'
) {
  try {
    // Try custom API first
    const result = await customapi.getCitations(citeId, language);
    return result;
  } catch (error) {
    // Log fallback event
    logFallback('getCitations', error as Error, { citeId, language });

    // Fallback to SearchAPI
    try {
      return await searchapi.getCitations(citeId, language);
    } catch (fallbackError) {
      logBothAPIsFailed('getCitations', error as Error, fallbackError as Error, { citeId, language });
      throw fallbackError;
    }
  }
}

// ========================================
// Functions without Custom API support
// Always use SearchAPI directly
// ========================================

/**
 * Get citation details for a specific citation
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function getCitationDetails(
  citationId: string,
  authorId?: string,
  language: string = 'en'
) {
  return searchapi.getCitationDetails(citationId, authorId, language);
}

/**
 * List author mandates
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function listMandates(
  authorId: string,
  options: {
    agencyId?: string;
    page?: number;
    language?: string;
  } = {}
) {
  return searchapi.listMandates(authorId, options);
}

/**
 * Get mandate details
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function getMandateDetails(
  citationId: string,
  authorId?: string,
  language: string = 'en'
) {
  return searchapi.getMandateDetails(citationId, authorId, language);
}

/**
 * List co-authors/colleagues
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function listColleagues(
  authorId: string,
  language: string = 'en'
) {
  return searchapi.listColleagues(authorId, language);
}

/**
 * Get cluster results (article versions)
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function getClusterResults(
  clusterId: string,
  options: {
    page?: number;
    language?: string;
  } = {}
) {
  return searchapi.getClusterResults(clusterId, options);
}

/**
 * Get citing articles
 * Custom API doesn't support this, always uses SearchAPI
 */
export async function getCitingArticles(
  citesId: string,
  options: {
    query?: string;
    page?: number;
    language?: string;
  } = {}
) {
  return searchapi.getCitingArticles(citesId, options);
}
