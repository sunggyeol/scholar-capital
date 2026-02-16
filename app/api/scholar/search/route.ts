import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/search?query={searchQuery}
 *
 * Searches for articles/works on OpenAlex
 * Docs: https://docs.openalex.org
 *
 * Query Parameters:
 * - query (required): Search query
 * - results (optional): Number of results per page (default: 25)
 * - page (optional): Page number (default: 1)
 * - filter (optional): OpenAlex filter string
 * - sort (optional): Sort order (e.g., 'cited_by_count:desc')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
        { status: 400 }
      );
    }

    const results = searchParams.get('results');
    const page = searchParams.get('page');
    const filter = searchParams.get('filter') || undefined;
    const sort = searchParams.get('sort') || undefined;

    const data = await searchArticles(query, {
      results: results ? parseInt(results, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      filter,
      sort,
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error searching articles:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
