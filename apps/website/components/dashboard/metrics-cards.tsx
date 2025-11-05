import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, PackageIcon, DownloadIcon, TrendingUpIcon, Star } from 'lucide-react';


interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
}

function MetricCard({ title, value, description, trend, icon }: MetricCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            {isPositiveTrend && (
              <>
                <ArrowUpIcon className="mr-1 h-3 w-3 text-white" />
                <span className="text-white">+{trend.value}%</span>
              </>
            )}
            {isNegativeTrend && (
              <>
                <ArrowDownIcon className="mr-1 h-3 w-3 text-red-600" />
                <span className="text-red-600">{trend.value}%</span>
              </>
            )}
            <span className="ml-1 text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsCardsProps {
  weeklyDownloads: number;
  monthlyDownloads: number;
  totalDownloads: number;
  versionsCount: number;
  maintainersCount: number;
  weeklyTrend?: number;
  monthlyTrend?: number;
  githubStars?: number | null;
}

export function MetricsCards({
  weeklyDownloads,
  monthlyDownloads,
  totalDownloads,
  versionsCount,
  weeklyTrend,
  monthlyTrend,
  githubStars,
}: MetricsCardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // Determine if we have all metrics to show
  const hasGithubStars = githubStars !== null && githubStars !== undefined;

  const totalMetrics = 3 + (hasGithubStars ? 1 : 0);

  return (
    <div className={`grid gap-4 md:grid-cols-2 ${totalMetrics >= 5 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
      <MetricCard
        title="Weekly Downloads"
        value={formatNumber(weeklyDownloads)}
        description="Last 7 days"
        icon={<DownloadIcon />}
        trend={weeklyTrend !== undefined ? {
          value: weeklyTrend,
          label: 'vs prev week'
        } : undefined}
      />
      <MetricCard
        title="Monthly Downloads"
        value={formatNumber(monthlyDownloads)}
        description="Last 30 days"
        icon={<TrendingUpIcon />}
        trend={monthlyTrend !== undefined ? {
          value: monthlyTrend,
          label: 'vs prev month'
        } : undefined}
      />
      <MetricCard
        title="Total Downloads (90 Days)"
        value={formatNumber(totalDownloads)}
        description="Last 90 days"
        icon={<TrendingUpIcon />}
      />
      {hasGithubStars && (
        <MetricCard
          title="GitHub Stars"
          value={formatNumber(githubStars)}
          description="Repository stars"
          icon={<Star />}
        />
      )}
      {!hasGithubStars && (
        <MetricCard
          title="Versions"
          value={versionsCount}
          description="Total published"
          icon={<PackageIcon />}
        />
      )}
    </div>
  );
}
