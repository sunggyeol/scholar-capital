import { NextRequest, NextResponse } from 'next/server';
import { searchProfiles } from '@/lib/scholar-client';
import { ScholarProfilesResponse } from '@/lib/types/scholar';

export const runtime = 'edge';

/**
 * GET /api/scholar/profiles?mauthors={authorName}
 * 
 * Searches for author profiles on Google Scholar via SearchAPI
 * Note: Uses google_scholar engine with "author:" prefix to find profiles
 * 
 * Query Parameters:
 * - mauthors (required): Author name to search for
 * - results (optional): Number of results per page (default: 10)
 * - page (optional): Page number (default: 1)
 * - hl (optional): Language (default: 'en')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const authorName = searchParams.get('mauthors');
    
    if (!authorName) {
      return NextResponse.json(
        { error: 'Missing required parameter: mauthors' },
        { status: 400 }
      );
    }
    
    const results = searchParams.get('results');
    const page = searchParams.get('page');
    const language = searchParams.get('hl') || 'en';
    
    const options: Parameters<typeof searchProfiles>[1] = {
      language,
    };
    
    if (results) {
      options.results = parseInt(results, 10);
    }
    
    if (page) {
      options.page = parseInt(page, 10);
    }
    
    const data: ScholarProfilesResponse = await searchProfiles(authorName, options);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error searching profiles:', error);
    
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

