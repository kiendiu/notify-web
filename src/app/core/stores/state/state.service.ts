import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { StateEngine } from './state.engine';
import { EngineState, setKeyState, removeKeyState, clearByPrefixState } from './state.reducer';

@Injectable({ providedIn: 'root' })
export class StateService implements StateEngine {
  constructor(private readonly store: Store<{ engineState: EngineState }>) {
    this.store.select(state => state.engineState?.cacheMap).subscribe(map => {
      if (map) this.currentMap = map;
    });
  }
  private currentMap: Record<string, unknown> = {};

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

  watch<T>(key: string): Observable<T | null> {
    return this.store.select((state) => (state.engineState?.cacheMap[key] as T | null) ?? null);
  }
}