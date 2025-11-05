'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, GitFork, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GitHubStatsProps {
  repositoryUrl?: string | { type: string; url: string };
}

interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export function GitHubStats({ repositoryUrl }: GitHubStatsProps) {
  const [stats, setStats] = useState<GitHubRepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchGitHubStats() {
      if (!repositoryUrl) {
        setLoading(false);
        return;
      }

      try {
        // Extract owner/repo from the repository URL
        const url = typeof repositoryUrl === 'string' ? repositoryUrl : repositoryUrl.url;

        // Handle different GitHub URL formats
        const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
        if (!match) {
          setError(true);
          setLoading(false);
          return;
        }

        const [, owner, repo] = match;
        const cleanRepo = repo.replace(/\.git$/, '');

        // Fetch from GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching GitHub stats:', err);
        setError(true);
        setLoading(false);
      }
    }

    fetchGitHubStats();
  }, [repositoryUrl]);

  if (!repositoryUrl || error) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-none shadow-none p-0">
        <CardHeader className="p-0">
          <CardTitle>GitHub Stats</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="border-none shadow-none p-0">
      <CardHeader className="p-0 pb-4">
        <CardTitle>GitHub Stats</CardTitle>
        <CardDescription>Repository metrics</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border p-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.stargazers_count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Stars</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-4">
            <GitFork className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.forks_count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Forks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.open_issues_count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Open Issues</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
