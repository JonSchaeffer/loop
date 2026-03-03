const MAX_ATTEMPTS = 3
const BLOCK_MS = 60_000

type Entry = { attempts: number; blockedUntil: number }

// Module-level store — persists for the lifetime of the Node process.
// Fine for a single-replica private app; swap for Redis if you ever scale out.
const store = new Map<string, Entry>()

export function isRateLimited(key: string): boolean {
  const entry = store.get(key)
  if (!entry) return false
  if (entry.blockedUntil > 0 && entry.blockedUntil <= Date.now()) {
    store.delete(key)
    return false
  }
  return entry.blockedUntil > Date.now()
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now()
  const entry = store.get(key) ?? { attempts: 0, blockedUntil: 0 }

  // If a previous block just expired, start fresh
  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    store.set(key, { attempts: 1, blockedUntil: 0 })
    return
  }

  const attempts = entry.attempts + 1
  const blockedUntil = attempts >= MAX_ATTEMPTS ? now + BLOCK_MS : 0
  store.set(key, { attempts, blockedUntil })
}

export function clearRateLimit(key: string): void {
  store.delete(key)
}
