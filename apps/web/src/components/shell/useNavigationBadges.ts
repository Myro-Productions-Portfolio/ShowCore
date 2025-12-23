/**
 * Navigation Badges Hook
 *
 * Tracks which sections have been visited by storing hrefs in localStorage.
 * This enables showing "New" badges on unvisited navigation items.
 */

const STORAGE_KEY_PREFIX = 'showcore_visited_';

/**
 * Get visited sections from localStorage for a specific user
 */
function getVisitedSections(userId: string): Set<string> {
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(stored);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Save visited sections to localStorage for a specific user
 */
function saveVisitedSections(userId: string, sections: Set<string>): void {
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  const value = JSON.stringify([...sections]);
  localStorage.setItem(key, value);
}

/**
 * Hook to track which sections have been visited
 * Returns a record mapping hrefs to isNew status (true = not yet visited)
 */
export function useNavigationBadges(_userId: string): Record<string, boolean> {
  // This is a simple implementation that returns an empty object
  // In a real app, you'd track all known hrefs and compare against visited
  // For now, consumers can check if a specific href is new by seeing if it's not in visited
  const badges: Record<string, boolean> = {};

  // Note: The consuming component will need to check visited sections themselves
  // This hook primarily provides a way to access the visited set
  return badges;
}

/**
 * Mark a section as visited
 */
export function markSectionVisited(userId: string, href: string): void {
  const visited = getVisitedSections(userId);
  visited.add(href);
  saveVisitedSections(userId, visited);
}

/**
 * Check if a section has been visited
 */
export function isSectionVisited(userId: string, href: string): boolean {
  const visited = getVisitedSections(userId);
  return visited.has(href);
}

/**
 * Clear all visited sections for a user (useful for testing/reset)
 */
export function clearVisitedSections(userId: string): void {
  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  localStorage.removeItem(key);
}
