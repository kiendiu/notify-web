import { InjectionToken, Provider, Type } from '@angular/core';

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  fetchedAt: number;
}

export interface CacheEngine {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clearByPrefix(prefix: string): void;
  isFresh<T>(entry: CacheEntry<T> | null | undefined, ttlMs: number): boolean;
  buildKey(scope: string, params?: Record<string, unknown>): string;
}

// Token này đại diện cho hệ thống Cache của toàn bộ App
export const CACHE_ENGINE = new InjectionToken<CacheEngine>('CACHE_ENGINE');

export function provideCacheEngine(implementation: Type<CacheEngine>): Provider {
  return {
    provide: CACHE_ENGINE,
    useExisting: implementation
  };
}