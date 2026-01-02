// Transform Custom API responses to match SearchAPI format
// This ensures compatibility with existing frontend code

/**
 * Transform a single article from Custom API format to SearchAPI format
 */
function transformArticle(article: any): any {
  if (!article) return article;

  const transformed = { ...article };

  // Transform cited_by_count to cited_by object
  if ('cited_by_count' in transformed) {
    const citedByCount = transformed.cited_by_count || 0;
    transformed.cited_by = {
      total: citedByCount,
      value: citedByCount ? String(citedByCount) : undefined,
    };
    delete transformed.cited_by_count;
  }

  // Ensure cited_by exists even if not in original
  if (!transformed.cited_by) {
    transformed.cited_by = {
      total: 0,
    };
  }

  // Add data_cid if missing but result_id exists
  if (!transformed.data_cid && transformed.result_id) {
    transformed.data_cid = transformed.result_id;
  }

  // Ensure title_link exists
  if (!transformed.title_link && transformed.link) {
    transformed.title_link = transformed.link;
  }

  return transformed;
}

/**
 * Transform search response from Custom API to SearchAPI format
 */
export function transformSearchResponse(response: any): any {
  if (!response) return response;

  const transformed = { ...response };

  // Transform organic_results articles
  if (transformed.organic_results && Array.isArray(transformed.organic_results)) {
    transformed.organic_results = transformed.organic_results.map(transformArticle);
  }

  // Add scholar_results for backward compatibility
  if (transformed.organic_results && !transformed.scholar_results) {
    transformed.scholar_results = transformed.organic_results;
  }

  // Extract profiles from organic_results if not present
  // Custom API doesn't return profiles separately, so we need to check if the response has them
  if (!transformed.profiles && transformed.organic_results) {
    // Profiles might be in the response already, or we leave it empty
    // The backend should add this if needed for author: searches
    transformed.profiles = transformed.profiles || [];
  }

  return transformed;
}

/**
 * Transform author profile response from Custom API to SearchAPI format
 */
export function transformAuthorResponse(response: any): any {
  if (!response) return response;

  const transformed = { ...response };

  // Transform articles array
  if (transformed.articles && Array.isArray(transformed.articles)) {
    transformed.articles = transformed.articles.map(transformArticle);
  }

  // Transform author cited_by if it exists
  if (transformed.author && transformed.author.cited_by_count !== undefined) {
    transformed.author.cited_by = {
      total: transformed.author.cited_by_count || 0,
    };
    delete transformed.author.cited_by_count;
  }

  return transformed;
}

/**
 * Transform profiles search response from Custom API to SearchAPI format
 */
export function transformProfilesResponse(response: any): any {
  if (!response) return response;

  const transformed = { ...response };

  // Transform profiles if they have cited_by_count
  if (transformed.profiles && Array.isArray(transformed.profiles)) {
    transformed.profiles = transformed.profiles.map((profile: any) => {
      const transformedProfile = { ...profile };

      if ('cited_by_count' in transformedProfile) {
        transformedProfile.cited_by = {
          total: transformedProfile.cited_by_count || 0,
        };
        delete transformedProfile.cited_by_count;
      }

      return transformedProfile;
    });
  }

  // Also transform organic_results if present (for author: search fallback)
  if (transformed.organic_results && Array.isArray(transformed.organic_results)) {
    transformed.organic_results = transformed.organic_results.map(transformArticle);
  }

  return transformed;
}

/**
 * Transform citations response from Custom API to SearchAPI format
 */
export function transformCitationsResponse(response: any): any {
  // Citations format is likely the same, but transform just in case
  return response;
}
