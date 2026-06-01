import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CacheEntry } from './cache.engine';

export interface MemoryCacheState extends EntityState<CacheEntry, string> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'client-cache', idKey: 'key' })
export class MemoryCacheStore extends EntityStore<MemoryCacheState, CacheEntry> {
  constructor() {
    super();
  }
}