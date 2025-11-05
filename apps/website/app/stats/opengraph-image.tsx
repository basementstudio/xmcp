import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'xmcp - Weekly NPM Package Statistics';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface DailyDownload {
  downloads: number;
  day: string;
}

interface DownloadRange {
  downloads: Array<DailyDownload>;
  start: string;
  end: string;
  package: string;
}

// Fetch last 7 days of download data
async function getWeeklyData(): Promise<{ total: number; dailyData: DailyDownload[] }> {
  try {
    const response = await fetch(
      'https://api.npmjs.org/downloads/range/last-week/xmcp',
      { next: { revalidate: 3600 }, cache: 'force-cache' }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch download data');
    }

    const data: DownloadRange = await response.json();
    const total = data.downloads.reduce((sum, day) => sum + day.downloads, 0);

    return {
      total,
      dailyData: data.downloads,
    };
  } catch (error) {
    console.error('Error fetching weekly data:', error);
    return {
      total: 0,
      dailyData: [],
    };
  }
}

export default async function Image() {
  const { total, dailyData } = await getWeeklyData();

  // Normalize data for chart visualization (0-100 scale)
  const maxDownloads = Math.max(...dailyData.map(d => d.downloads), 1);
  const normalizedData = dailyData.map(day => ({
    ...day,
    heightPercent: (day.downloads / maxDownloads) * 100,
  }));

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#0a0a0a',
          padding: '50px',
          gap: '50px',
        }}
      >
        {/* Left Column - Logo and Download Count */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: '0 0 380px',
          }}
        >
          {/* xmcp SVG Logo */}
          <svg width="280" height="108" viewBox="0 0 63 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '50px' }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M52.5 18.1313V18.9556H58.5116V18.1313H56.794V14.2731H57.6526V15.1333H59.3703V15.9934H60.229V15.1333H61.9469V14.2731H62.8055V7.39184H61.9469V5.67147H61.0877V4.81129H59.3703V3.95117H57.6526V4.81129H55.9353V5.67147H55.0763V6.53165H52.5V7.39184H53.3587V18.1313H52.5ZM57.6526 14.2731V13.4129H56.794V5.67147H57.6526V6.53165H58.5116V7.39184H59.3703V14.2731H57.6526Z" fill="#F7F7F7"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M46.3668 16.9969H47.3703V15.9934H48.3739V14.9899H50.3809V15.9934H49.3775V16.9969H48.3739V18.0005H47.3703V19.004H44.3598V18.0005H42.3526V16.9969H41.3493V9.97232H40.3457V8.96879H41.3493V7.96527H42.3526V6.96175H43.3562V5.95822H45.3634V4.9547H47.3703V3.95117H48.3739V4.9547H49.3775V5.95822H50.3809V6.96175H51.3845V7.96527H50.3809V10.9758H49.3775V9.97232H48.3739V8.96879H47.3703V7.96527H46.3668V6.96175H45.3634V15.9934H46.3668V16.9969ZM50.3809 14.9899V13.9864H51.3845V14.9899H50.3809Z" fill="#F7F7F7"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M36.0598 3.95117V4.9547H35.0562V5.95822H34.0529V6.96175H32.0457V5.95822H31.0423V4.9547H30.0388V3.95117H29.0352V4.9547H28.0316V5.95822H27.0282V6.96175H25.021V5.95822H24.0175V4.9547H23.0141V3.95117H22.0105V4.9547H21.0069V5.95822H19V6.96175H21.0069V16.9969H20.0033V18.0005H22.0105V19.004H24.0175V18.0005H26.0246V16.9969H25.021V7.96527H27.0282V6.96175H28.0316V16.9969H27.0282V18.0005H29.0352V19.004H31.0423V18.0005H33.0493V16.9969H32.0457V7.96527H34.0529V6.96175H35.0562V16.9969H34.0529V18.0005H36.0598V19.004H38.067V18.0005H40.0739V16.9969H39.0703V7.96527H40.0739V6.96175H39.0703V5.95822H38.067V4.9547H37.0634V3.95117H36.0598Z" fill="#F7F7F7"></path>
              <path d="M0 5H1.00213V6H0V5ZM1.00213 22V19H2.00426V18H3.0064V17H5.01066V16H6.01279V15H7.01492V17H9.01919V18H10.0213V19H11.0235V20H10.0213V21H9.01919V22H8.01706V21H7.01492V20H5.01066V21H4.00853V23H5.01066V24H3.0064V23H2.00426V22H1.00213ZM1.00213 5V3H2.00426V2H3.0064V1H7.01492V2H9.01919V3H10.0213V5H11.0235V6H12.0256V7H13.0277V8H12.0256V9H17.0362V10H16.0341V11H14.0298V13H15.032V14H16.0341V15H17.0362V17H18.0384V18H19.0405V19H17.0362V20H16.0341V21H15.032V20H14.0298V18H13.0277V16H12.0256V15H11.0235V13H9.01919V12H2.00426V11H3.0064V10H4.00853V9H8.01706V8H7.01492V6H6.01279V4H5.01066V3H4.00853V4H2.00426V5H1.00213ZM7.01492 15V14H8.01706V15H7.01492ZM8.01706 14V13H9.01919V14H8.01706ZM11.0235 19V18H12.0256V19H11.0235ZM11.0235 5V4H12.0256V5H11.0235ZM12.0256 4V3H13.0277V1H15.032V2H17.0362V1H19.0405V4H18.0384V5H16.0341V6H15.032V5H14.0298V7H13.0277V4H12.0256ZM19.0405 18V17H20.0426V18H19.0405ZM19.0405 1V0H20.0426V1H19.0405Z" fill="#F7F7F7"></path>
            </svg>

          {/* Weekly downloads metric */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '120px',
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1,
                marginBottom: '20px',
              }}
            >
              {total.toLocaleString()}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#a1a1aa',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Weekly Downloads
            </div>
          </div>
        </div>

        {/* Right Column - Chart */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          {/* Chart container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Line path using SVG */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 700 530"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {/* Area gradient fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                </linearGradient>
              </defs>

              {/* Generate smooth path using Catmull-Rom interpolation */}
              <path
                d={(() => {
                  const points = normalizedData.map((day, i) => ({
                    x: 20 + (i * (660 / (normalizedData.length - 1))),
                    y: 530 - Math.max(day.heightPercent * 4.5, 50),
                  }));

                  // Generate smooth curve using quadratic bezier curves
                  let path = `M ${points[0].x} ${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlX = (current.x + next.x) / 2;
                    const controlY = (current.y + next.y) / 2;

                    path += ` Q ${current.x} ${current.y}, ${controlX} ${controlY}`;
                  }

                  // Complete the last segment
                  const last = points[points.length - 1];
                  const secondLast = points[points.length - 2];
                  path += ` Q ${secondLast.x} ${secondLast.y}, ${last.x} ${last.y}`;

                  // Close area path
                  path += ` L ${680} 530 L ${20} 530 Z`;

                  return path;
                })()}
                fill="url(#areaGradient)"
              />

              {/* Smooth line stroke */}
              <path
                d={(() => {
                  const points = normalizedData.map((day, i) => ({
                    x: 20 + (i * (660 / (normalizedData.length - 1))),
                    y: 530 - Math.max(day.heightPercent * 4.5, 50),
                  }));

                  let path = `M ${points[0].x} ${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlX = (current.x + next.x) / 2;
                    const controlY = (current.y + next.y) / 2;

                    path += ` Q ${current.x} ${current.y}, ${controlX} ${controlY}`;
                  }

                  const last = points[points.length - 1];
                  const secondLast = points[points.length - 2];
                  path += ` Q ${secondLast.x} ${secondLast.y}, ${last.x} ${last.y}`;

                  return path;
                })()}
                stroke="#ffffff"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
