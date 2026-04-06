export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  default_branch: string;
  score: number;
}

export interface SearchFilters {
  owner?: string;
  language: string;
  minStars: number;
  sort: 'best-match' | 'stars' | 'forks' | 'updated' | 'oldest' | 'newest';
  order: 'desc' | 'asc';
  safetyRating?: number;
  os?: 'mac' | 'linux' | 'windows' | '';
}

export interface AIRating {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  relatedTech: string[];
  tutorial: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}