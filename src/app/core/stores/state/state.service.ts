import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { StateEngine } from './state.engine';
import { EngineState, setKeyState, removeKeyState, clearByPrefixState } from './state.reducer';

@Injectable({ providedIn: 'root' })
export class StateService implements StateEngine {
  private readonly store = inject(Store<{ engineState: EngineState }>);
  private currentMap: Record<string, unknown> = {};

  constructor() {
    this.store.select(state => state.engineState?.cacheMap).subscribe(map => {
      if (map) this.currentMap = map;
    });
  }

  get<T>(key: string): T | null {
    return (this.currentMap[key] as T) ?? null;
  }

  set<T>(key: string, value: T): void {
    this.store.dispatch(setKeyState({ key, value }));
  }

  update<T>(key: string, updater: (current: T | null) => T): void {
    const currentVal = this.get<T>(key);
    this.set(key, updater(currentVal));
  }

  remove(key: string): void {
    this.store.dispatch(removeKeyState({ key }));
  }

  clearByPrefix(prefix: string): void {
    this.store.dispatch(clearByPrefixState({ prefix }));
  }
}