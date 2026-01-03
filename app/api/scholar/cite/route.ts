import { NextRequest, NextResponse } from 'next/server';
import { getCitations } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/cite?q={dataCid}
 * 
 * Gets citation formats for a specific article via SerpApi
 * Docs: https://serpapi.com/google-scholar-cite-api
 * 
 * Query Parameters:
 * - q (required): Article data_cid from search results
 * - data_cid (optional): Alias for q parameter
 * - hl (optional): Language (default: 'en')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Support both q (SerpApi) and data_cid (legacy) parameters
    const dataCid = searchParams.get('q') || searchParams.get('data_cid');
    
    if (!dataCid) {
      return NextResponse.json(
        { error: 'Missing required parameter: q or data_cid' },
        { status: 400 }
      );
    }
    
    const language = searchParams.get('hl') || 'en';
    
    const data = await getCitations(dataCid, language);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching citations:', error);
    
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
