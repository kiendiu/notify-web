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
    return this.http.get<T>(
      url,
      options,
    );
  }

  post<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.post<T>(
      url,
      body,
      options,
    );
  }

  put<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.put<T>(
      url,
      body,
      options,
    );
  }

  delete<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.http.delete<T>(
      url,
      options,
    );
  }

  request<T>(
    method: string,
    url: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.http.request<T>(
      method,
      url,
      options,
    );
  }
}