import { effect, Injectable, Injector, WritableSignal } from '@angular/core';

export interface UiViewStateBinding<TView extends string, TSelected> {
  viewKey: string;
  selectedKey?: string;
  defaultView: TView;
  view: WritableSignal<TView>;
  selected?: WritableSignal<TSelected | null>;
  injector: Injector;
  serializeSelected?: (value: TSelected) => string;
  deserializeSelected?: (rawValue: string) => TSelected | null;
}

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly prefix = 'kien-notify-web:ui:';

  get<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawValue = window.sessionStorage.getItem(this.storageKey(key));
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(this.storageKey(key), JSON.stringify(value));
    } catch {
      // Ignore session storage failures.
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(this.storageKey(key));
  }

  clearByPrefix(prefix: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const fullPrefix = this.storageKey(prefix);
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key && key.startsWith(fullPrefix)) {
        window.sessionStorage.removeItem(key);
      }
    }
  }

  bindViewState<TView extends string, TSelected>(binding: UiViewStateBinding<TView, TSelected>): void {
    const savedView = this.get<TView>(binding.viewKey);
    if (savedView) {
      binding.view.set(savedView);
    } else {
      binding.view.set(binding.defaultView);
    }

    if (binding.selected && binding.selectedKey) {
      const savedSelectedRaw = this.readRaw(binding.selectedKey);
      if (savedSelectedRaw != null) {
        const restoredSelected = binding.deserializeSelected
          ? binding.deserializeSelected(savedSelectedRaw)
          : (JSON.parse(savedSelectedRaw) as TSelected | null);
        binding.selected.set(restoredSelected);
      } else {
        binding.selected.set(null);
      }
    }

    effect(
      () => {
        const currentView = binding.view();
        this.set(binding.viewKey, currentView);

        if (!binding.selected || !binding.selectedKey) {
          return;
        }

        const currentSelected = binding.selected();
        if (currentSelected == null) {
          this.remove(binding.selectedKey);
          return;
        }

        if (binding.serializeSelected) {
          this.writeRaw(binding.selectedKey, binding.serializeSelected(currentSelected as TSelected));
          return;
        }

        this.writeRaw(binding.selectedKey, JSON.stringify(currentSelected));
      },
      { injector: binding.injector },
    );
  }

  private readRaw(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.sessionStorage.getItem(this.storageKey(key));
  }

  private writeRaw(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(this.storageKey(key), value);
  }

  private storageKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
