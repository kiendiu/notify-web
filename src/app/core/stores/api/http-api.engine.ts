import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ApiEngine,
  ApiRequestOptions,
} from './api.engine.interface';

@Injectable({
  providedIn: 'root',
})
export class HttpApiEngine
  implements ApiEngine {

  private readonly http =
    inject(HttpClient);

  get<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.get(url, options as any) as Observable<T>;
  }

  post<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.post(url, body, options as any) as Observable<T>;
  }

  put<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.put(url, body, options as any) as Observable<T>;
  }

  delete<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.delete(url, options as any) as Observable<T>;
  }

  request<T>(
    method: string,
    url: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.request(method, url, options as any) as Observable<T>;
  }
}