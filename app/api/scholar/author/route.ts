import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthorProfile } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/author?user={authorId}
 *
 * Fetches author profile data from OpenAlex
 * Docs: https://docs.openalex.org
 *
 * Query Parameters:
 * - user (required): OpenAlex author ID (e.g., "A5023888391")
 * - results (optional): Number of articles to return (default: 200)
 * - page (optional): Page number for pagination
 * - sortby (optional): Sort order ('pubdate' | 'citedby')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const authorId = searchParams.get('user');

    if (!authorId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user' },
        { status: 400 }
      );
    }

    const results = searchParams.get('results');
    const page = searchParams.get('page');
    const sortby = searchParams.get('sortby') as 'pubdate' | 'citedby' | null;

    const options: Parameters<typeof fetchAuthorProfile>[1] = {};

    if (results) {
      options.results = parseInt(results, 10);
    }

    if (page) {
      options.page = parseInt(page, 10);
    }

    if (sortby) {
      options.sortby = sortby;
    }

    const data = await fetchAuthorProfile(authorId, options);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching author profile:', error);

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
