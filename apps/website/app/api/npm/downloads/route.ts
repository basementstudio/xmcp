import { NextResponse } from 'next/server';
import type { DownloadPoint, DownloadRange } from '@/lib/types/npm';

const PACKAGE_NAME = 'xmcp';
const NPM_DOWNLOADS_API = 'https://api.npmjs.org/downloads';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'last-year';

  try {
    // Fetch data based on period
    let endpoint: string;

    // Check if period is a date range (contains ':') or a range keyword
    const isRange = period.includes(':') || period === 'last-year';

    if (isRange) {
      endpoint = `${NPM_DOWNLOADS_API}/range/${period}/${PACKAGE_NAME}`;
    } else {
      endpoint = `${NPM_DOWNLOADS_API}/point/${period}/${PACKAGE_NAME}`;
    }

    const response = await fetch(endpoint, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch downloads: ${response.statusText}`);
    }

    const data: DownloadPoint | DownloadRange = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching download statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download statistics' },
      { status: 500 }
    );
  }
}

// Fetch multiple periods at once
export async function POST(request: Request) {
  try {
    const { periods } = await request.json();

    const promises = periods.map(async (period: string) => {
      const isRange = period.includes(':') || period === 'last-year';
      const endpoint = isRange
        ? `${NPM_DOWNLOADS_API}/range/${period}/${PACKAGE_NAME}`
        : `${NPM_DOWNLOADS_API}/point/${period}/${PACKAGE_NAME}`;

      const response = await fetch(endpoint, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${period}`);
      }

      return { period, data: await response.json() };
    });

    const results = await Promise.all(promises);

    return NextResponse.json(
      results.reduce((acc, { period, data }) => ({
        ...acc,
        [period]: data,
      }), {})
    );
  } catch (error) {
    console.error('Error fetching multiple download statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download statistics' },
      { status: 500 }
    );
  }
}
