import { NextRequest, NextResponse } from 'next/server';
import { searchProfiles } from '@/lib/scholar-client';

export const runtime = 'edge';

/**
 * GET /api/scholar/resolve-gs?id={googleScholarId}
 *
 * Resolves a Google Scholar author ID to OpenAlex author(s) by:
 * 1. Fetching the Google Scholar profile page
 * 2. Extracting the author name from the <title> tag
 * 3. Searching OpenAlex for matching authors
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gsId = searchParams.get('id');

  if (!gsId) {
    return NextResponse.json(
      { error: 'Missing required parameter: id' },
      { status: 400 }
    );
  }

  try {
    // Fetch the Google Scholar profile page
    const gsUrl = `https://scholar.google.com/citations?user=${encodeURIComponent(gsId)}&hl=en`;
    const response = await fetch(gsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Google Scholar profile' },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Extract name from <title>Sunggyeol Oh - Google Scholar</title>
    // Google Scholar wraps names with Unicode bidi marks (U+202A, U+202C, etc.)
    const titleMatch = html.match(/<title>([\s\S]+?)\s*-\s*[\s\S]*?Google Scholar[\s\S]*?<\/title>/i);
    if (!titleMatch) {
      return NextResponse.json(
        { error: 'Could not extract author name from Google Scholar profile' },
        { status: 404 }
      );
    }

    // Strip Unicode bidi/formatting characters from the extracted name
    const authorName = titleMatch[1].replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, '').trim();

    // Search OpenAlex for matching authors
    const results = await searchProfiles(authorName, { results: 5 });
    const matches = results.profiles.authors.map((a) => ({
      author_id: a.author_id,
      name: a.name,
      affiliations: a.affiliations,
      cited_by: a.cited_by,
    }));

    return NextResponse.json({ name: authorName, matches });
  } catch (error) {
    console.error('Error resolving Google Scholar ID:', error);
    return NextResponse.json(
      { error: 'Failed to resolve Google Scholar profile' },
      { status: 500 }
    );
  }
}
