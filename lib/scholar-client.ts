// Google Scholar client using SerpApi
// Documentation: https://serpapi.com/google-scholar-api

import * as serpapi from './serpapi';

/**
 * Search for articles on Google Scholar
 */
export async function searchArticles(
  query: string,
  options: {
    results?: number;       // Number of results (default: 10)
    page?: number;          // Page number (default: 1)
    language?: string;      // Language (default: 'en')
    asYlo?: string;         // Starting year
    asYhi?: string;         // Ending year
    scisbd?: number;        // Sort by date (0=relevance, 1=date)
    cites?: string;         // Citation ID
    cluster?: string;       // Cluster ID
  } = {}
) {
  const num = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * num;

  return serpapi.searchArticles(query, {
    num,
    start,
    hl: options.language || 'en',
    as_ylo: options.asYlo,
    as_yhi: options.asYhi,
    scisbd: options.scisbd,
    cites: options.cites,
    cluster: options.cluster,
  });
}

/**
 * Fetch author profile data
 */
export async function fetchAuthorProfile(
  authorId: string,
  options: {
    results?: number;
    page?: number;
    language?: string;
    sortby?: 'pubdate' | 'citedby';
    viewOp?: 'view_citation' | 'list_colleagues';
    citationId?: string;
  } = {}
) {
  const num = options.results;
  const page = options.page || 1;
  const start = num ? (page - 1) * num : undefined;

  return serpapi.fetchAuthorProfile(authorId, {
    num,
    start,
    hl: options.language || 'en',
    sort: options.sortby,
    view_op: options.viewOp,
    citation_id: options.citationId,
  });
}

/**
 * Search for author profiles using author: query helper
 */
export async function searchProfiles(
  authorName: string,
  options: {
    language?: string;
    results?: number;
    page?: number;
  } = {}
) {
  const num = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * num;

  return serpapi.searchProfiles(authorName, {
    hl: options.language || 'en',
    num,
    start,
  });
}

/**
 * Get citation formats for an article
 */
export async function getCitations(
  dataCid: string,
  language: string = 'en'
) {
  return serpapi.getCitations(dataCid, language);
}

/**
 * Get citation details for a specific citation
 */
export async function getCitationDetails(
  citationId: string,
  authorId: string,
  language: string = 'en'
) {
  return serpapi.getCitationDetails(citationId, authorId, language);
}

/**
 * List co-authors/colleagues
 */
export async function listColleagues(
  authorId: string,
  language: string = 'en'
) {
  return serpapi.listColleagues(authorId, language);
}

/**
 * Get citing articles
 */
export async function getCitingArticles(
  citesId: string,
  options: {
    query?: string;
    page?: number;
    results?: number;
    language?: string;
  } = {}
) {
  const num = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * num;

  return serpapi.getCitingArticles(citesId, {
    q: options.query,
    start,
    num,
    hl: options.language || 'en',
  });
}

/**
 * Get cluster results (article versions)
 */
export async function getClusterResults(
  clusterId: string,
  options: {
    page?: number;
    results?: number;
    language?: string;
  } = {}
) {
  const num = options.results || 10;
  const page = options.page || 1;
  const start = (page - 1) * num;

  return serpapi.getClusterResults(clusterId, {
    start,
    num,
    hl: options.language || 'en',
  });
}
