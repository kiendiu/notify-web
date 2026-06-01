import { InjectionToken, Provider, Type } from '@angular/core';

export interface StateEngine {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  update<T>(key: string, updater: (current: T | null) => T): void;
  remove(key: string): void;
  clearByPrefix(prefix: string): void;
}

export const STATE_ENGINE = new InjectionToken<StateEngine>('STATE_ENGINE');

export function provideStateEngine(implementation: Type<StateEngine>): Provider {
  return {
    provide: STATE_ENGINE,
    useExisting: implementation
  };
}