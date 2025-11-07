import { NextResponse } from 'next/server';
import type { VersionDownloads } from '@/lib/types/npm';

const PACKAGE_NAME = 'xmcp';
const NPM_DOWNLOADS_API = 'https://api.npmjs.org/downloads';

export async function GET() {
  try {
    const response = await fetch(
      `${NPM_DOWNLOADS_API}/point/last-week/${PACKAGE_NAME}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch version downloads: ${response.statusText}`);
    }

    const data: VersionDownloads = await response.json();

    // Sort versions by download count (descending)
    const sortedDownloads = Object.entries(data.downloads || {})
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [version, count]) => ({
        ...acc,
        [version]: count,
      }), {});

    return NextResponse.json({
      ...data,
      downloads: sortedDownloads,
    });
  } catch (error) {
    console.error('Error fetching version downloads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version downloads' },
      { status: 500 }
    );
  }
}
