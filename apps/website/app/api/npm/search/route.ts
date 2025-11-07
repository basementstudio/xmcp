import { NextResponse } from 'next/server';
import type { SearchResponse } from '@/lib/types/npm';

const PACKAGE_NAME = 'xmcp';
const NPM_SEARCH_API = 'https://registry.npmjs.org/-/v1/search';

export async function GET() {
  try {
    const response = await fetch(
      `${NPM_SEARCH_API}?text=${PACKAGE_NAME}&size=1`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch search data: ${response.statusText}`);
    }

    const data: SearchResponse = await response.json();

    // Find exact package match
    const packageResult = data.objects.find(
      (obj) => obj.package.name === PACKAGE_NAME
    );

    if (!packageResult) {
      throw new Error('Package not found in search results');
    }

    return NextResponse.json(packageResult);
  } catch (error) {
    console.error('Error fetching search data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search data' },
      { status: 500 }
    );
  }
}
