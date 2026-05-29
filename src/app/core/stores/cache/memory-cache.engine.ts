import { Injectable } from '@angular/core';
import { MemoryCacheStore } from './memory-cache.store';
import { CacheEngine, CacheEntry } from './cache.engine';

@Injectable({ providedIn: 'root' })
export class MemoryCacheEngine implements CacheEngine {
  constructor(private readonly store: MemoryCacheStore) {}
  private readonly prefix = 'kien-notify-web:';

  get<T>(key: string): CacheEntry<T> | null {
    const state = this.store.getValue();
    const entry = state?.entities?.[key];
    if (entry) {
      return entry as CacheEntry<T>;
    }

    const rawValue = this.readStorage(key);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as CacheEntry<T>;
      if (!this.isValidEntry(parsed)) {
        return null;
      }

      this.store.upsert(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      fetchedAt: Date.now(),
    };

    this.store.upsert(key, entry);
    this.writeStorage(key, entry);
  }

  remove(key: string): void {
    this.store.remove(key);
    this.deleteStorage(key);
  }

  clearByPrefix(prefix: string): void {
    const entities = this.store.getValue()?.entities ?? {};
    for (const key of Object.keys(entities)) {
      if (key.startsWith(prefix)) {
        this.store.remove(key);
      }
    }

    if (typeof window === 'undefined') {
      return;
    }

    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (storageKey && storageKey.startsWith(this.storageKey(prefix))) {
        keysToRemove.push(storageKey);
      }
    }

    for (const storageKey of keysToRemove) {
      window.localStorage.removeItem(storageKey);
    }
  }

  isFresh<T>(entry: CacheEntry<T> | null | undefined, ttlMs: number): boolean {
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

  private writeStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(this.storageKey(key), JSON.stringify(entry));
    } catch {
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

  private isValidEntry<T>(entry: Partial<CacheEntry<T>> | null): entry is CacheEntry<T> {
    return Boolean(entry && typeof entry.key === 'string' && typeof entry.fetchedAt === 'number' && 'value' in entry);
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