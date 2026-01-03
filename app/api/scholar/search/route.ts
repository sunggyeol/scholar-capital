import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/search?query={searchQuery}
 * 
 * Searches for articles on Google Scholar via SerpApi
 * Docs: https://serpapi.com/google-scholar-api
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
 * - scisbd (optional): Sort by date (0=relevance, 1=date)
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
    
    const data = await searchArticles(query, options);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error searching articles:', error);
    
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
