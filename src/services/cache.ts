// ============================================================
// Cache Layer — In-memory + localStorage
// ============================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheLayer {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    };
    this.memoryCache.set(key, entry);

    // Also persist to localStorage if available
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`defi_cache_${key}`, JSON.stringify(entry));
      } catch {
        // localStorage full or unavailable
      }
    }
  }

  get<T>(key: string): T | null {
    // Check memory first
    const memEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      return memEntry.data;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`defi_cache_${key}`);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (Date.now() - entry.timestamp < entry.ttl) {
            // Warm memory cache
            this.memoryCache.set(key, entry);
            return entry.data;
          }
          localStorage.removeItem(`defi_cache_${key}`);
        }
      } catch {
        // Parse error
      }
    }

    return null;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('defi_cache_'))
        .forEach((k) => localStorage.removeItem(k));
    }
  }
}

export const cache = new CacheLayer();
