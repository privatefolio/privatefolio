export interface GitHubUser {
  avatar_url: string
  login: string
  name: string | null
}

const cache = new Map<string, GitHubUser>()

export async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  if (!username) return null

  if (cache.has(username)) return cache.get(username)!

  try {
    const response = await fetch(`https://api.github.com/users/${username}`)

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data: GitHubUser = await response.json()
    cache.set(username, data)
    return data
  } catch (error) {
    console.warn(`Failed to fetch GitHub user ${username}:`, error)
    return null
  }
}
