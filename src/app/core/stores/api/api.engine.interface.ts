import { InjectionToken, Provider, Type } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<
    string,
    string | number | boolean |
    readonly (string | number | boolean)[]
  >;

  body?: unknown;
}

export interface ApiEngine {

  get<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T>;

  post<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T>;

  put<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T>;

  delete<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T>;

  request<T>(
    method: string,
    url: string,
    options?: ApiRequestOptions,
  ): Observable<T>;
}

export const API_ENGINE =
  new InjectionToken<ApiEngine>(
    'API_ENGINE',
  );

export function provideApiEngine(
  implementation: Type<ApiEngine>,
): Provider {
  return {
    provide: API_ENGINE,
    useExisting: implementation,
  };
}