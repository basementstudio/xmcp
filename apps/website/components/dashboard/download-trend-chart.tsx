'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import type { DailyDownload } from '@/lib/types/npm';

interface DownloadTrendChartProps {
  data: DailyDownload[];
}

type TimeRange = '7' | '30' | '90' | '365' | 'all';

export function DownloadTrendChart({ data }: DownloadTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30');

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') {
      return data;
    }
    const days = parseInt(timeRange);
    return data.slice(-days);
  }, [data, timeRange]);

  // Format data for the chart
  const chartData = filteredData.map((item) => ({
    date: format(new Date(item.day), 'MMM dd'),
    fullDate: item.day,
    downloads: item.downloads,
  }));

  // Calculate total for the selected range
  const totalDownloads = filteredData.reduce((sum, day) => sum + day.downloads, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Card className="col-span-full border-none shadow-none p-0">
      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Download Trend</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {formatNumber(totalDownloads)} downloads in the last {timeRange === 'all' ? data.length : timeRange} days
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <TabsList>
            <TabsTrigger value="7">7D</TabsTrigger>
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
            <TabsTrigger value="365">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className='p-0'>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Date
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.fullDate}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Downloads
                          </span>
                          <span className="font-bold">
                            {payload[0].value?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="downloads"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#colorDownloads)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
