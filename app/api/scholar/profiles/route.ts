import { NextRequest, NextResponse } from 'next/server';
import { searchProfiles } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/profiles?mauthors={authorName}
 * 
 * Searches for author profiles on Google Scholar via SerpApi
 * Uses the author: query helper since google_scholar_profiles is discontinued
 * Docs: https://serpapi.com/google-scholar-api
 * 
 * Query Parameters:
 * - mauthors (required): Author name to search for
 * - hl (optional): Language (default: 'en')
 * - results (optional): Number of results (default: 10)
 * - page (optional): Page number (default: 1)
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
    
    const language = searchParams.get('hl') || 'en';
    const results = searchParams.get('results');
    const page = searchParams.get('page');
    
    const data = await searchProfiles(authorName, {
      language,
      results: results ? parseInt(results, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error searching profiles:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { error: 'API key not configured. Please set SERPAPI_API_KEY in environment variables.' },
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
