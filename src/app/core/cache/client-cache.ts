import { Injectable } from '@angular/core';

export interface ClientCacheEntry<T> {
  value: T;
  fetchedAt: number;
}

@Injectable({ providedIn: 'root' })
export class ClientCacheService {
  private readonly prefix = 'kien-notify-web:';
  private readonly memoryCache = new Map<string, ClientCacheEntry<unknown>>();

  get<T>(key: string): ClientCacheEntry<T> | null {
    const memoryEntry = this.memoryCache.get(key) as ClientCacheEntry<T> | undefined;
    if (memoryEntry) {
      return memoryEntry;
    }

    const rawValue = this.readStorage(key);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as ClientCacheEntry<T>;
      if (!this.isValidEntry(parsed)) {
        return null;
      }
      this.memoryCache.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const entry: ClientCacheEntry<T> = {
      value,
      fetchedAt: Date.now(),
    };

    this.memoryCache.set(key, entry);
    this.writeStorage(key, entry);
  }

  remove(key: string): void {
    this.memoryCache.delete(key);
    this.deleteStorage(key);
  }

  clearByPrefix(prefix: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    if (typeof window === 'undefined') {
      return;
    }

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey || !storageKey.startsWith(this.storageKey(prefix))) {
        continue;
      }
      window.localStorage.removeItem(storageKey);
    }
  }

  isFresh<T>(entry: ClientCacheEntry<T> | null | undefined, ttlMs: number): boolean {
    if (!entry) {
      return false;
    }
    return Date.now() - entry.fetchedAt <= ttlMs;
  }

  buildKey(scope: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return scope;
    }
    return `${scope}:${this.stableStringify(params)}`;
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(this.storageKey(key));
  }

  private writeStorage<T>(key: string, entry: ClientCacheEntry<T>): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey(key), JSON.stringify(entry));
    } catch {
      // Ignore storage quota or serialization issues.
    }
  }

  private deleteStorage(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(this.storageKey(key));
  }

  private storageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isValidEntry<T>(entry: Partial<ClientCacheEntry<T>> | null): entry is ClientCacheEntry<T> {
    return Boolean(entry && typeof entry.fetchedAt === 'number' && 'value' in entry);
  }

  private stableStringify(value: Record<string, unknown>): string {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const current = value[key];
      normalized[key] = current && typeof current === 'object' && !Array.isArray(current)
        ? this.parseStableObject(current as Record<string, unknown>)
        : current;
    }
    return JSON.stringify(normalized);
  }

  private parseStableObject(value: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      normalized[key] = value[key];
    }
    return normalized;
  }
}
