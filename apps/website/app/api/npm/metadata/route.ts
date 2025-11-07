import { NextResponse } from 'next/server';
import type { PackageMetadata } from '@/lib/types/npm';

const PACKAGE_NAME = 'xmcp';
const NPM_REGISTRY_API = 'https://registry.npmjs.org';

export async function GET() {
  try {
    const response = await fetch(
      `${NPM_REGISTRY_API}/${PACKAGE_NAME}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch package metadata: ${response.statusText}`);
    }

    const data: PackageMetadata = await response.json();

    // Extract useful summary information
    const latestVersion = data['dist-tags']?.latest || '';
    const latestVersionData = latestVersion ? data.versions[latestVersion] : null;
    const versionsCount = Object.keys(data.versions).length;
    const lastPublished = data.time?.[latestVersion] || '';

    return NextResponse.json({
      name: data.name,
      description: data.description,
      latestVersion,
      versionsCount,
      lastPublished,
      license: latestVersionData?.license || data.license,
      author: data.author,
      maintainers: data.maintainers,
      keywords: data.keywords,
      repository: data.repository,
      homepage: data.homepage,
      bugs: data.bugs,
      unpackedSize: latestVersionData?.dist?.unpackedSize,
      fileCount: latestVersionData?.dist?.fileCount,
      dependencies: latestVersionData?.dependencies,
      devDependencies: latestVersionData?.devDependencies,
      peerDependencies: latestVersionData?.peerDependencies,
    });
  } catch (error) {
    console.error('Error fetching package metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package metadata' },
      { status: 500 }
    );
  }
}
