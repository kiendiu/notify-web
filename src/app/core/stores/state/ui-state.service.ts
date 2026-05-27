import { effect, Injectable, Injector, WritableSignal, inject } from '@angular/core';
import { StateService } from './state.service';

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

@Injectable()
export class UiStateService {
  private readonly prefix = 'kien-notify-web:ui:';
  private readonly stateService = inject(StateService);

  get<T>(key: string): T | null {
    return this.stateService.get<T>(this.storageKey(key));
  }

  set<T>(key: string, value: T): void {
    this.stateService.set(this.storageKey(key), value);
  }

  remove(key: string): void {
    this.stateService.remove(this.storageKey(key));
  }

  clearByPrefix(prefix: string): void {
    this.stateService.clearByPrefix(this.storageKey(prefix));
  }

  bindViewState<TView extends string, TSelected>(binding: UiViewStateBinding<TView, TSelected>): void {
    const savedView = this.get<TView>(binding.viewKey);
    if (savedView) {
      binding.view.set(savedView);
    } else {
      binding.view.set(binding.defaultView);
    }

    if (binding.selected && binding.selectedKey) {
      const savedSelectedRaw = this.get<string>(binding.selectedKey);
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
          this.set(binding.selectedKey, binding.serializeSelected(currentSelected as TSelected));
          return;
        }

        this.set(binding.selectedKey, JSON.stringify(currentSelected));
      },
      { injector: binding.injector },
    );
  }

  private storageKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}