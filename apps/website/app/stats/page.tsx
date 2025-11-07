import { Suspense } from 'react';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { DownloadTrendChart } from '@/components/dashboard/download-trend-chart';
import { VersionDistributionChart } from '@/components/dashboard/version-distribution-chart';
import { PackageInfo } from '@/components/dashboard/package-info';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { DownloadPoint, DownloadRange, VersionDownloads } from '@/lib/types/npm';


export const revalidate = 3600;

async function getDashboardData() {
  const PACKAGE_NAME = 'xmcp';
  const NPM_DOWNLOADS_API = 'https://api.npmjs.org/downloads';
  const NPM_REGISTRY_API = 'https://registry.npmjs.org';

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Helper function to create 18-month date chunks
  const createDateChunks = (startDate: Date, endDate: Date) => {
    const chunks: Array<{ start: string; end: string }> = [];
    const current = new Date(startDate);

    while (current < endDate) {
      const chunkEnd = new Date(current);
      chunkEnd.setMonth(chunkEnd.getMonth() + 18);

      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }

      chunks.push({
        start: formatDate(current),
        end: formatDate(chunkEnd)
      });

      // Move to next day after chunk end
      current.setTime(chunkEnd.getTime());
      current.setDate(current.getDate() + 1);
    }

    return chunks;
  };

  try {
    const metadataRes = await fetch(`${NPM_REGISTRY_API}/${PACKAGE_NAME}`, {
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });

    if (!metadataRes.ok) {
      throw new Error('Failed to fetch package metadata');
    }

    const rawMetadata = await metadataRes.json();

    const createdDate = rawMetadata.time?.created;
    if (!createdDate) {
      throw new Error('Package creation date not found');
    }


    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Set to yesterday to exclude today's incomplete data
    const startDate = new Date(createdDate);

    const npmStatsStartDate = new Date('2015-01-10');
    if (startDate < npmStatsStartDate) {
      startDate.setTime(npmStatsStartDate.getTime());
    }

    // For calculating weekly trend (previous week)
    const prevWeekEnd = new Date();
    prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
    const prevWeekStart = new Date();
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    // For calculating monthly trend (previous month)
    const prevMonthEnd = new Date();
    prevMonthEnd.setDate(prevMonthEnd.getDate() - 30);
    const prevMonthStart = new Date();
    prevMonthStart.setDate(prevMonthStart.getDate() - 60);

    // For 90-day downloads
    const last90DaysEnd = new Date();
    last90DaysEnd.setDate(last90DaysEnd.getDate() - 1);
    const last90DaysStart = new Date();
    last90DaysStart.setDate(last90DaysStart.getDate() - 90);

    const prevWeekRange = `${formatDate(prevWeekStart)}:${formatDate(prevWeekEnd)}`;
    const prevMonthRange = `${formatDate(prevMonthStart)}:${formatDate(prevMonthEnd)}`;
    const last90DaysRange = `${formatDate(last90DaysStart)}:${formatDate(last90DaysEnd)}`;

    // Create date chunks for all-time data (npm API limit: 18 months per request)
    const dateChunks = createDateChunks(startDate, endDate);

    const fetchPromises = [
      fetch(`${NPM_DOWNLOADS_API}/point/last-week/${PACKAGE_NAME}`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      fetch(`${NPM_DOWNLOADS_API}/point/last-month/${PACKAGE_NAME}`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      fetch(`https://api.npmjs.org/versions/${PACKAGE_NAME}/last-week`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      fetch(`${NPM_DOWNLOADS_API}/range/${prevWeekRange}/${PACKAGE_NAME}`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      fetch(`${NPM_DOWNLOADS_API}/range/${prevMonthRange}/${PACKAGE_NAME}`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      fetch(`${NPM_DOWNLOADS_API}/range/${last90DaysRange}/${PACKAGE_NAME}`, {
        next: { revalidate: 3600 },
        cache: 'force-cache'
      }),
      ...dateChunks.map(chunk =>
        fetch(`${NPM_DOWNLOADS_API}/range/${chunk.start}:${chunk.end}/${PACKAGE_NAME}`, {
          next: { revalidate: 3600 },
          cache: 'force-cache'
        })
      )
    ];

    const responses = await Promise.all(fetchPromises);

    // Check if all requests succeeded
    if (responses.some(res => !res.ok)) {
      throw new Error('Failed to fetch dashboard data');
    }

    // Parse responses
    const [weeklyRes, monthlyRes, versionsRes, prevWeekRes, prevMonthRes, last90DaysRes, ...chunkResponses] = responses;

    const [weekly, monthly, versions, prevWeek, prevMonth, last90Days]: [
      DownloadPoint,
      DownloadPoint,
      VersionDownloads,
      DownloadRange,
      DownloadRange,
      DownloadRange
    ] = await Promise.all([
      weeklyRes.json(),
      monthlyRes.json(),
      versionsRes.json(),
      prevWeekRes.json(),
      prevMonthRes.json(),
      last90DaysRes.json(),
    ]);

    // Parse and combine all chunk data
    const chunkDataArrays: DownloadRange[] = await Promise.all(
      chunkResponses.map(res => res.json())
    );

    // Merge all downloads chronologically
    const allDownloads = chunkDataArrays.flatMap(chunk => chunk.downloads);

    const range: DownloadRange = {
      start: formatDate(startDate),
      end: formatDate(endDate),
      package: PACKAGE_NAME,
      downloads: allDownloads
    };

    // Process metadata the same way as the API route
    const latestVersion = rawMetadata['dist-tags']?.latest || '';
    const latestVersionData = latestVersion ? rawMetadata.versions[latestVersion] : null;
    const versionsCount = Object.keys(rawMetadata.versions).length;
    const lastPublished = rawMetadata.time?.[latestVersion] || '';

    const metadata = {
      name: rawMetadata.name,
      description: rawMetadata.description,
      latestVersion,
      versionsCount,
      lastPublished,
      license: latestVersionData?.license || rawMetadata.license,
      author: rawMetadata.author,
      maintainers: rawMetadata.maintainers,
      keywords: rawMetadata.keywords,
      repository: rawMetadata.repository,
      homepage: rawMetadata.homepage,
      bugs: rawMetadata.bugs,
      unpackedSize: latestVersionData?.dist?.unpackedSize,
      fileCount: latestVersionData?.dist?.fileCount,
      dependencies: latestVersionData?.dependencies,
      devDependencies: latestVersionData?.devDependencies,
      peerDependencies: latestVersionData?.peerDependencies,
    };

    // Calculate trends
    const prevWeekTotal = prevWeek.downloads.reduce((sum, day) => sum + day.downloads, 0);
    const prevMonthTotal = prevMonth.downloads.reduce((sum, day) => sum + day.downloads, 0);
    const last90DaysTotal = last90Days.downloads.reduce((sum, day) => sum + day.downloads, 0);

    const weeklyTrend = prevWeekTotal > 0
      ? Math.round(((weekly.downloads - prevWeekTotal) / prevWeekTotal) * 100)
      : 0;

    const monthlyTrend = prevMonthTotal > 0
      ? Math.round(((monthly.downloads - prevMonthTotal) / prevMonthTotal) * 100)
      : 0;

    // Fetch GitHub stars, dependents, and repositories data in parallel
    let githubStars: number | null = null;

    const additionalFetches: Promise<{ type: string; data: number | null }>[] = [];

    // Add GitHub stars fetch if repository is available
    if (metadata.repository) {
      try {
        const repoUrl = typeof metadata.repository === 'string'
          ? metadata.repository
          : metadata.repository.url;
        const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (match) {
          const [, owner, repo] = match;
          const cleanRepo = repo.replace(/\.git$/, '');
          additionalFetches.push(
            fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
              next: { revalidate: 3600 },
            }).then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                return { type: 'github', data: data.stargazers_count };
              }
              return { type: 'github', data: null };
            }).catch(() => ({ type: 'github', data: null }))
          );
        }
      } catch (error) {
        console.error('Error preparing GitHub fetch:', error);
      }
    }

    // Execute additional fetches in parallel
    const additionalResults = await Promise.all(additionalFetches);
    additionalResults.forEach(result => {
      if (result.type === 'github') {
        githubStars = result.data;
      }
    });

    return {
      weekly,
      monthly,
      last90Days: last90DaysTotal,
      range,
      metadata,
      versions,
      trends: {
        weekly: weeklyTrend,
        monthly: monthlyTrend,
      },
      githubStars,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32 mb-2" />
        <div className="flex items-center gap-1 mt-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

async function VersionBadge() {
  try {
    const res = await fetch('https://registry.npmjs.org/xmcp', {
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch version data');
    }
    
    const data = await res.json();
    const latestVersion = data['dist-tags']?.latest || '';
    
    return (
      <Badge variant="outline" className="text-lg font-mono">
        v{latestVersion}
      </Badge>
    );
  } catch (error) {
    console.error('Error fetching version badge:', error);
    return (
      <Badge variant="outline" className="text-lg font-mono text-muted-foreground">
        N/A
      </Badge>
    );
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Download Trend Chart */}
      <Card className="col-span-full border-none shadow-none p-0">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
          <div className="rounded-lg bg-muted p-1 inline-flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-10 rounded-md" />
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="w-full h-[350px]" />
        </CardContent>
      </Card>

      {/* Version Distribution - 2 column grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart Card */}
        <Card className="border-none shadow-none p-0">
          <CardHeader className="p-0 mb-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <Skeleton className="w-full h-[300px]" />
        </Card>

        {/* Table Card */}
        <Card className="border-none shadow-none p-0">
          <CardHeader className="p-0 mb-4">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Package Info */}
      <Card className="border-none shadow-none p-0">
        <CardContent className="space-y-6 p-0">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
            {/* Maintainers section */}
            <div className="flex items-start gap-2 sm:col-span-2">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          {/* <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}

async function DashboardContent() {
  const data = await getDashboardData();

  const totalRangeDownloads = data.range.downloads.reduce(
    (sum, day) => sum + day.downloads,
    0
  );

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <MetricsCards
        weeklyDownloads={data.weekly.downloads}
        monthlyDownloads={data.monthly.downloads}
        last90DaysDownloads={data.last90Days}
        totalDownloads={totalRangeDownloads}
        versionsCount={data.metadata.versionsCount}
        maintainersCount={data.metadata.maintainers?.length || 0}
        weeklyTrend={data.trends.weekly}
        monthlyTrend={data.trends.monthly}
        githubStars={data.githubStars}
      />

      {/* Download Trend Chart */}
      <DownloadTrendChart data={data.range.downloads} />

      {/* Version Distribution */}
      <VersionDistributionChart versions={data.versions.downloads} />

      {/* Package Dependents */}
      {/* {data.dependents && (data.dependents as LibrariesIODependentsResponse).dependents_count > 0 && (
        <PackageDependents
          dependents={data.dependents as LibrariesIODependentsResponse}
          repositories={data.repositories as LibrariesIORepositoriesResponse | null}
        />
      )} */}

      {/* Package Info Header */}
      <PackageInfo
        name={data.metadata.name}
        description={data.metadata.description}
        latestVersion={data.metadata.latestVersion}
        license={data.metadata.license}
        repository={data.metadata.repository}
        homepage={data.metadata.homepage}
        keywords={data.metadata.keywords}
        lastPublished={data.metadata.lastPublished}
        unpackedSize={data.metadata.unpackedSize}
        versionsCount={data.metadata.versionsCount}
        maintainers={data.metadata.maintainers}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Static header - renders immediately */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3">
            <a href="https://xmcp.dev" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <svg width="63" height="24" viewBox="0 0 63 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer">
                <path fillRule="evenodd" clipRule="evenodd" d="M52.5 18.1313V18.9556H58.5116V18.1313H56.794V14.2731H57.6526V15.1333H59.3703V15.9934H60.229V15.1333H61.9469V14.2731H62.8055V7.39184H61.9469V5.67147H61.0877V4.81129H59.3703V3.95117H57.6526V4.81129H55.9353V5.67147H55.0763V6.53165H52.5V7.39184H53.3587V18.1313H52.5ZM57.6526 14.2731V13.4129H56.794V5.67147H57.6526V6.53165H58.5116V7.39184H59.3703V14.2731H57.6526Z" fill="#F7F7F7"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M46.3668 16.9969H47.3703V15.9934H48.3739V14.9899H50.3809V15.9934H49.3775V16.9969H48.3739V18.0005H47.3703V19.004H44.3598V18.0005H42.3526V16.9969H41.3493V9.97232H40.3457V8.96879H41.3493V7.96527H42.3526V6.96175H43.3562V5.95822H45.3634V4.9547H47.3703V3.95117H48.3739V4.9547H49.3775V5.95822H50.3809V6.96175H51.3845V7.96527H50.3809V10.9758H49.3775V9.97232H48.3739V8.96879H47.3703V7.96527H46.3668V6.96175H45.3634V15.9934H46.3668V16.9969ZM50.3809 14.9899V13.9864H51.3845V14.9899H50.3809Z" fill="#F7F7F7"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M36.0598 3.95117V4.9547H35.0562V5.95822H34.0529V6.96175H32.0457V5.95822H31.0423V4.9547H30.0388V3.95117H29.0352V4.9547H28.0316V5.95822H27.0282V6.96175H25.021V5.95822H24.0175V4.9547H23.0141V3.95117H22.0105V4.9547H21.0069V5.95822H19V6.96175H21.0069V16.9969H20.0033V18.0005H22.0105V19.004H24.0175V18.0005H26.0246V16.9969H25.021V7.96527H27.0282V6.96175H28.0316V16.9969H27.0282V18.0005H29.0352V19.004H31.0423V18.0005H33.0493V16.9969H32.0457V7.96527H34.0529V6.96175H35.0562V16.9969H34.0529V18.0005H36.0598V19.004H38.067V18.0005H40.0739V16.9969H39.0703V7.96527H40.0739V6.96175H39.0703V5.95822H38.067V4.9547H37.0634V3.95117H36.0598Z" fill="#F7F7F7"></path>
                <path d="M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z" fill="#F7F7F7"></path>
              </svg>
            </a>
            <Suspense fallback={<Skeleton className="h-7 w-20 rounded-md" />}>
              <VersionBadge />
            </Suspense>
          </div>
          <p className="mt-4 text-center text-muted-foreground">
            Real-time analytics and metrics for the xmcp npm package
          </p>
        </div>

        {/* Dashboard content */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </main>
    </div>
  );
}
