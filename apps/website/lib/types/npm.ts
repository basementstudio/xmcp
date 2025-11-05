// Download statistics types
export interface DownloadPoint {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface DailyDownload {
  day: string;
  downloads: number;
}

export interface DownloadRange {
  downloads: DailyDownload[];
  start: string;
  end: string;
  package: string;
}

export interface VersionDownloads {
  package: string;
  downloads: Record<string, number>;
}

// Package metadata types
export interface PackageVersion {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  homepage?: string;
  bugs?: {
    url?: string;
  };
  license?: string;
  author?: Person | string;
  contributors?: (Person | string)[];
  maintainers?: (Person | string)[];
  repository?: Repository | string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  dist?: {
    tarball: string;
    shasum: string;
    integrity?: string;
    fileCount?: number;
    unpackedSize?: number;
  };
  _npmUser?: Person;
  _npmVersion?: string;
  _nodeVersion?: string;
}

export interface Person {
  name: string;
  email?: string;
  url?: string;
  username?: string;
}

export interface Repository {
  type: string;
  url: string;
  directory?: string;
}

export interface PackageMetadata {
  _id: string;
  _rev: string;
  name: string;
  description?: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, PackageVersion>;
  time: Record<string, string>;
  maintainers: Person[];
  author?: Person | string;
  repository?: Repository | string;
  keywords?: string[];
  license?: string;
  readme?: string;
  readmeFilename?: string;
  homepage?: string;
  bugs?: {
    url?: string;
  };
}

// Search API types
export interface SearchScore {
  final: number;
  detail: {
    quality: number;
    popularity: number;
    maintenance: number;
  };
}

export interface SearchPackage {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  date?: string;
  links?: {
    npm?: string;
    homepage?: string;
    repository?: string;
    bugs?: string;
  };
  author?: Person;
  publisher?: Person;
  maintainers?: Person[];
}

export interface SearchResult {
  package: SearchPackage;
  score: SearchScore;
  searchScore: number;
  downloads?: {
    weekly?: number;
    monthly?: number;
  };
}

export interface SearchResponse {
  objects: SearchResult[];
  total: number;
  time: string;
}

// Libraries.io API types
export interface LibrariesIODependent {
  name: string;
  platform: string;
  description?: string;
  homepage?: string;
  repository_url?: string;
  normalized_licenses?: string[];
  rank?: number;
  latest_release_published_at?: string;
  latest_stable_release_number?: string;
  language?: string;
  status?: string;
  package_manager_url?: string;
  stars?: number;
  forks?: number;
  keywords?: string[];
  latest_download_url?: string;
  dependents_count?: number;
  dependent_repos_count?: number;
}

export interface LibrariesIODependentsResponse {
  dependents_count: number;
  dependent_repos_count: number;
  dependents: LibrariesIODependent[];
}

export interface LibrariesIORepository {
  full_name: string;
  description?: string;
  language?: string;
  stars: number;
  forks?: number;
  homepage?: string;
  repository_url: string;
  last_pushed?: string;
  updated_at?: string;
  owner?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface LibrariesIORepositoriesResponse {
  dependent_repos_count: number;
  repositories: LibrariesIORepository[];
}

// Combined dashboard data type
export interface DashboardData {
  downloads: {
    lastWeek: DownloadPoint;
    lastMonth: DownloadPoint;
    lastYear: DownloadRange;
  };
  versions: VersionDownloads;
  metadata: PackageMetadata;
  search: SearchResult;
  dependents?: LibrariesIODependentsResponse;
  repositories?: LibrariesIORepositoriesResponse;
}
