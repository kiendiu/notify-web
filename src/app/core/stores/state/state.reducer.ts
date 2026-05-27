import { createAction, createReducer, on, props } from '@ngrx/store';

export interface EngineState {
  cacheMap: Record<string, unknown>;
}

const initialState: EngineState = {
  cacheMap: {}
};

export const setKeyState = createAction('[Engine State] Set Key', props<{ key: string; value: unknown }>());
export const removeKeyState = createAction('[Engine State] Remove Key', props<{ key: string }>());
export const clearByPrefixState = createAction('[Engine State] Clear By Prefix', props<{ prefix: string }>());

export const engineStateReducer = createReducer(
  initialState,
  on(setKeyState, (state, { key, value }) => ({
    ...state,
    cacheMap: { ...state.cacheMap, [key]: value }
  })),
  on(removeKeyState, (state, { key }) => {
    const newCache = { ...state.cacheMap };
    delete newCache[key];
    return { ...state, cacheMap: newCache };
  }),
  on(clearByPrefixState, (state, { prefix }) => {
    const newCache = { ...state.cacheMap };
    Object.keys(newCache).forEach(key => {
      if (key.startsWith(prefix)) delete newCache[key];
    });
    return { ...state, cacheMap: newCache };
  })
);