import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/searchapi';
import { ScholarSearchResponse } from '@/lib/types/scholar';

export const runtime = 'edge';

/**
 * GET /api/scholar/search?query={searchQuery}
 * 
 * Searches for articles on Google Scholar via SearchAPI
 * 
 * Query Parameters:
 * - query (required): Search query
 * - results (optional): Number of results per page (default: 10, max: 20)
 * - page (optional): Page number (default: 1)
 * - hl (optional): Language (default: 'en')
 * - as_ylo (optional): Starting year for results
 * - as_yhi (optional): Ending year for results
 * - cites (optional): Citation ID for "Cited By" search
 * - cluster (optional): Cluster ID for article versions
 * - scisbd (optional): Sort by date filter (0=relevance, 1=date+abstracts, 2=date)
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
    const language = searchParams.get('hl') || 'en';
    const asYlo = searchParams.get('as_ylo') || undefined;
    const asYhi = searchParams.get('as_yhi') || undefined;
    const cites = searchParams.get('cites') || undefined;
    const cluster = searchParams.get('cluster') || undefined;
    const scisbd = searchParams.get('scisbd');
    
    const options: Parameters<typeof searchArticles>[1] = {
      language,
    };
    
    if (results) {
      options.results = parseInt(results, 10);
    }
    
    if (page) {
      options.page = parseInt(page, 10);
    }
    
    if (asYlo) {
      options.asYlo = asYlo;
    }
    
    if (asYhi) {
      options.asYhi = asYhi;
    }
    
    if (cites) {
      options.cites = cites;
    }
    
    if (cluster) {
      options.cluster = cluster;
    }
    
    if (scisbd) {
      options.scisbd = parseInt(scisbd, 10);
    }
    
    const data: ScholarSearchResponse = await searchArticles(query, options);
    
    // Ensure backward compatibility by mapping organic_results to scholar_results
    if (data.organic_results && !data.scholar_results) {
      data.scholar_results = data.organic_results;
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
    
  } catch (error) {
    console.error('Error searching articles:', error);
    
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

