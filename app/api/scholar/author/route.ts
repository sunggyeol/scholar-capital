import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthorProfile } from '@/lib/searchapi';
import { ScholarAuthorResponse } from '@/lib/types/scholar';

export const runtime = 'edge';

/**
 * GET /api/scholar/author?user={authorId}
 * 
 * Fetches author profile data from Google Scholar via SearchAPI
 * 
 * Query Parameters:
 * - user (required): Google Scholar author ID
 * - results (optional): Number of articles to return
 * - hl (optional): Language (default: 'en')
 * - sortby (optional): Sort order ('title' | 'pubdate')
 * - view_op (optional): View operation ('view_citation' | 'list_colleagues' | 'list_mandates' | 'view_mandate')
 * - citation_id (optional): Citation ID (required when view_op=view_citation or view_mandate)
 * - page (optional): Page number for pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get author ID from 'user' parameter (matching Google Scholar URL structure)
    const authorId = searchParams.get('user');
    
    if (!authorId) {
      return NextResponse.json(
        { error: 'Missing required parameter: user' },
        { status: 400 }
      );
    }
    
    // Parse optional parameters
    const results = searchParams.get('results');
    const language = searchParams.get('hl') || 'en';
    const sortby = searchParams.get('sortby') as 'title' | 'pubdate' | null;
    const viewOp = searchParams.get('view_op') as 'view_citation' | 'list_colleagues' | 'list_mandates' | 'view_mandate' | null;
    const citationId = searchParams.get('citation_id');
    const page = searchParams.get('page');
    
    // Build options object
    const options: Parameters<typeof fetchAuthorProfile>[1] = {
      language,
    };
    
    if (results) {
      options.results = parseInt(results, 10);
    }
    
    if (sortby) {
      options.sortby = sortby;
    }
    
    if (viewOp) {
      options.viewOp = viewOp;
    }
    
    if (citationId) {
      options.citationId = citationId;
    }
    
    if (page) {
      options.page = parseInt(page, 10);
    }
    
    // Fetch data from SearchAPI
    const data: ScholarAuthorResponse = await fetchAuthorProfile(authorId, options);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
    
  } catch (error) {
    console.error('Error fetching author profile:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { error: 'API key not configured. Please set SEARCHAPI_API_KEY in environment variables.' },
          { status: 500 }
        );
      }
      
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

