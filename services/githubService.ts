import { GitHubRepo, SearchFilters } from '../types';

const BASE_URL = "https://api.github.com/search/repositories";

export const searchGitHub = async (
  optimizedQuery: string, 
  filters: SearchFilters, 
  page: number = 1
): Promise<{ items: GitHubRepo[], total_count: number }> => {
  
  let q = optimizedQuery;

  // Append manual filters to the query string if not already present
  if (filters.language && !q.includes('language:')) {
    q += ` language:${filters.language}`;
  }
  if (filters.minStars > 0 && !q.includes('stars:')) {
    q += ` stars:>=${filters.minStars}`;
  }
  if (filters.owner && !q.includes('user:') && !q.includes('org:')) {
    q += ` user:${filters.owner}`;
  }
  if (filters.os) {
    if (filters.os === 'mac') q += ` macOS`;
    if (filters.os === 'linux') q += ` linux`;
    if (filters.os === 'windows') q += ` windows`;
  }

  const params = new URLSearchParams({
    q: q,
    per_page: "30", // High per_page to find "everything"
    page: page.toString()
  });

  if (filters.sort !== 'best-match' && filters.sort !== 'oldest' && filters.sort !== 'newest') {
    params.append('sort', filters.sort);
    params.append('order', filters.order);
  }

  try {
    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: {
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (!res.ok) {
      if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Please wait a minute.");
      if (res.status === 422) throw new Error("Search query invalid or too long.");
      throw new Error(`GitHub Error: ${res.status}`);
    }

    const data = await res.json();
    
    // Client-side sorting for oldest/newest since GitHub API doesn't support sorting by created_at natively in search
    if (data.items && data.items.length > 0) {
      if (filters.sort === 'oldest') {
        data.items.sort((a: GitHubRepo, b: GitHubRepo) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (filters.sort === 'newest') {
        data.items.sort((a: GitHubRepo, b: GitHubRepo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
    }

    return data;
  } catch (error) {
    console.error("GitHub API Error:", error);
    throw error;
  }
};