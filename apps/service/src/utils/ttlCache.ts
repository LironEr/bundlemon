/**
 * Minimal in-memory cache with TTL and a max size (oldest entry is evicted first).
 * Lives as long as the process (on Vercel - as long as the Fluid instance).
 */
export class TtlCache<K, V> {
  private readonly entries = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxSize: number
  ) {}

  get(key: K): V | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V): void {
    // re-insert to move the key to the end of the insertion order
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    if (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next().value as K;
      this.entries.delete(oldestKey);
    }
  }

  delete(key: K): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
