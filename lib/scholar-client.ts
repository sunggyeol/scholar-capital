// Scholar client using OpenAlex API
// Documentation: https://docs.openalex.org

import * as openalex from './openalex';
import type {
  ScholarAuthorResponse,
  AuthorArticle,
  ScholarProfile,
  ScholarArticle,
} from './types/scholar';

/**
 * Normalize an OpenAlex work into an AuthorArticle
 */
function normalizeWork(work: any): AuthorArticle {
  const workId = openalex.extractId(work.id);

  // Extract authors from authorships
  const authors: Array<{ name: string; id?: string; link?: string }> =
    (work.authorships || []).map((authorship: any) => ({
      name: authorship.author?.display_name || 'Unknown',
      id: authorship.author?.id ? openalex.extractId(authorship.author.id) : undefined,
      link: authorship.author?.id
        ? `https://openalex.org/authors/${openalex.extractId(authorship.author.id)}`
        : undefined,
    }));

  // Extract venue from primary_location
  const publication = work.primary_location?.source?.display_name || undefined;

  // Build external link (prefer DOI, fallback to OpenAlex URL)
  const link = work.doi || `https://openalex.org/works/${workId}`;

  return {
    title: work.title || 'Untitled',
    link,
    citation_id: workId,
    authors,
    publication,
    cited_by: {
      value: work.cited_by_count || 0,
      total: work.cited_by_count || 0,
    },
    year: work.publication_year,
  };
}

/**
 * Normalize an OpenAlex author into a ScholarProfile
 */
function normalizeAuthorProfile(author: any): ScholarProfile {
  const authorId = openalex.extractId(author.id);
  const institution = author.last_known_institutions?.[0];

  return {
    name: author.display_name,
    author_id: authorId,
    link: `https://openalex.org/authors/${authorId}`,
    affiliations: institution?.display_name || undefined,
    cited_by: author.cited_by_count || 0,
    works_count: author.works_count || 0,
  };
}

/**
 * Fetch author profile and their works from OpenAlex
 * Returns normalized ScholarAuthorResponse
 */
export async function fetchAuthorProfile(
  authorId: string,
  options: {
    results?: number;
    page?: number;
    sortby?: 'pubdate' | 'citedby';
  } = {}
): Promise<ScholarAuthorResponse> {
  // Fetch author info and works in parallel
  const [authorData, worksData] = await Promise.all([
    openalex.getAuthor(authorId),
    openalex.getAuthorWorks(authorId, {
      perPage: options.results || 200,
      page: options.page || 1,
      sort: options.sortby === 'citedby' ? 'cited_by_count:desc' : 'publication_year:desc',
    }),
  ]);

  const institution = authorData.last_known_institutions?.[0];

  // Normalize articles
  const articles: AuthorArticle[] = (worksData.results || []).map(normalizeWork);

  // Build cited_by stats
  const citedByTable = [
    { citations: { all: authorData.cited_by_count || 0 } },
    { h_index: { all: authorData.summary_stats?.h_index || 0 } },
    { i10_index: { all: authorData.summary_stats?.i10_index || 0 } },
  ];

  // Build citation graph from counts_by_year
  const citedByGraph = (authorData.counts_by_year || []).map((entry: any) => ({
    year: entry.year,
    citations: entry.cited_by_count || 0,
  }));

  // Build topics/interests
  const interests = (authorData.topics || []).slice(0, 10).map((topic: any) => ({
    title: topic.display_name,
    link: `https://openalex.org/topics/${openalex.extractId(topic.id)}`,
  }));

  return {
    author: {
      name: authorData.display_name,
      author_id: openalex.extractId(authorData.id),
      affiliations: institution?.display_name || undefined,
      interests,
    },
    articles,
    cited_by: {
      table: citedByTable,
      graph: citedByGraph,
    },
    co_authors: [],
  };
}

/**
 * Search for author profiles using OpenAlex
 */
export async function searchProfiles(
  authorName: string,
  options: {
    results?: number;
    page?: number;
  } = {}
): Promise<{ profiles: { authors: ScholarProfile[] }; has_more: boolean }> {
  const data = await openalex.searchAuthors(authorName, {
    perPage: options.results || 10,
    page: options.page || 1,
  });

  const authors: ScholarProfile[] = (data.results || []).map(normalizeAuthorProfile);

  const totalResults = data.meta?.count || 0;
  const currentPage = data.meta?.page || 1;
  const perPage = data.meta?.per_page || 10;
  const hasMore = currentPage * perPage < totalResults;

  return {
    profiles: { authors },
    has_more: hasMore,
  };
}

/**
 * Search for articles/works using OpenAlex
 */
export async function searchArticles(
  query: string,
  options: {
    results?: number;
    page?: number;
    filter?: string;
    sort?: string;
  } = {}
) {
  const data = await openalex.searchWorks(query, {
    perPage: options.results || 25,
    page: options.page || 1,
    filter: options.filter,
    sort: options.sort,
  });

  const results: ScholarArticle[] = (data.results || []).map((work: any) => {
    const normalized = normalizeWork(work);
    return {
      ...normalized,
      result_id: normalized.citation_id,
      publication_info: {
        summary: normalized.publication,
        authors: Array.isArray(normalized.authors)
          ? normalized.authors.map(a => ({
              name: a.name,
              author_id: a.id,
              link: a.link,
            }))
          : undefined,
      },
    };
  });

  const totalResults = data.meta?.count || 0;
  const currentPage = data.meta?.page || 1;
  const perPage = data.meta?.per_page || 25;

  return {
    total_results: totalResults,
    page: currentPage,
    per_page: perPage,
    results,
    has_more: currentPage * perPage < totalResults,
  };
}

/**
 * Get a single work by OpenAlex ID
 */
export async function getWorkDetails(workId: string) {
  const work = await openalex.getWork(workId);
  return normalizeWork(work);
}
