/**
 * Where tables keep their last URL state between visits (see usePersistedUrlParams). Entries are
 * namespaced by the signed-in user: `shared` can't read the auth store, so the app sets the scope
 * from it (`app/main.tsx`). Without a scope nothing is read or written — a guest has no tables,
 * and another account's category ids must never leak into the next one's filters.
 */
const PREFIX = "urlParams"

let scope: string | null = null

/** The signed-in user's id, or null when signed out. */
export function setPersistScope(userId: string | null): void {
  scope = userId
}

const storageKey = (key: string) => (scope ? `${PREFIX}:${scope}:${key}` : null)

/** The saved query string for `key`, or null when there is none (or no storage at all —
 *  private mode, blocked site data). */
export function readPersistedParams(key: string): string | null {
  const k = storageKey(key)
  if (!k) return null
  try {
    return localStorage.getItem(k) || null
  } catch {
    return null
  }
}

/** Saves the query string for `key`; an empty one clears it. */
export function writePersistedParams(key: string, query: string): void {
  const k = storageKey(key)
  if (!k) return
  try {
    if (query) localStorage.setItem(k, query)
    else localStorage.removeItem(k)
  } catch {
    // storage unavailable or full — the table just won't remember its state
  }
}
