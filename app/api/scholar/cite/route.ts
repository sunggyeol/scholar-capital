import { NextRequest, NextResponse } from 'next/server';
import { getCitations } from '@/lib/searchapi';
import { ScholarCiteResponse } from '@/lib/types/scholar';

export const runtime = 'edge';

/**
 * GET /api/scholar/cite?data_cid={dataCid}
 * 
 * Gets citation formats for a specific article via SearchAPI
 * 
 * Query Parameters:
 * - data_cid (required): Article data_cid from search results
 * - query (optional): Legacy parameter (will use data_cid if present)
 * - hl (optional): Language (default: 'en')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Support both data_cid (SearchAPI) and query (legacy) parameters
    const dataCid = searchParams.get('data_cid') || searchParams.get('query');
    
    if (!dataCid) {
      return NextResponse.json(
        { error: 'Missing required parameter: data_cid or query' },
        { status: 400 }
      );
    }
    
    const language = searchParams.get('hl') || 'en';
    
    const data: ScholarCiteResponse = await getCitations(dataCid, language);
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    });
    
  } catch (error) {
    console.error('Error fetching citations:', error);
    
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

