'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelProps } from 'recharts';

interface VersionDistributionChartProps {
  versions: Record<string, number>;
}

const BAR_COLOR = '#ffffff'; // white

export function VersionDistributionChart({ versions }: VersionDistributionChartProps) {
  // Get top 5 versions
  const topVersions = Object.entries(versions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const total = Object.values(versions).reduce((sum, count) => sum + count, 0);

  // Prepare chart data
  const chartData = topVersions.map(([version, downloads]) => ({
    version,
    downloads,
    percentage: ((downloads / total) * 100).toFixed(1),
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className='border-none shadow-none p-0'>
        <CardHeader className='p-0'>
          <CardTitle>Top Versions</CardTitle>
          <CardDescription>Downloads by version (last week)</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <XAxis
                type="number"
                hide={true}
              />
              <YAxis
                type="category"
                dataKey="version"
                hide={true}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Downloads
                          </span>
                          <span className="font-bold text-lg">
                            {payload[0].value?.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payload[0].payload.percentage}% of total
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="downloads" radius={[0, 4, 4, 0]} fill={BAR_COLOR} label={{
                content: ({ x, y, width, height, index }: LabelProps) => {
                  const version = chartData[index as number]?.version;
                  const badgeWidth = 60;
                  const minBarWidth = badgeWidth + 16; // Minimum width to fit badge inside
                  const barWidth = Number(width);

                  // If bar is too small, place badge outside (to the right)
                  const isOutside = barWidth < minBarWidth;
                  const badgeX = isOutside
                    ? Number(x) + barWidth + 8  // Outside: right of bar
                    : Number(x) + barWidth - badgeWidth - 8; // Inside: at end of bar

                  return (
                    <g>
                      <rect
                        x={badgeX}
                        y={Number(y) + (Number(height) / 2) - 10}
                        width={badgeWidth}
                        height={20}
                        rx={4}
                        fill="#000000"
                        stroke="#333333"
                        strokeWidth={1}
                      />
                      <text
                        x={badgeX + badgeWidth / 2}
                        y={Number(y) + (Number(height) / 2) + 4}
                        fill="#ffffff"
                        fontSize={11}
                        fontWeight="500"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        v{version}
                      </text>
                    </g>
                  );
                }
              }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className='border-none shadow-none p-0'>
        <CardHeader className='p-0'>
          <CardTitle>Version Details</CardTitle>
          <CardDescription>Download breakdown by version</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topVersions.map(([version, downloads], index) => {
                const percentage = ((downloads / total) * 100).toFixed(1);
                return (
                  <TableRow key={version}>
                    <TableCell className="font-mono text-sm">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        v{version}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {downloads.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {percentage}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
