import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiEngine, ApiEngineError, ApiRequestOptions } from './api.engine.interface';

@Injectable({ providedIn: 'root'})
export class HttpApiEngine implements ApiEngine {
  constructor(private readonly http: HttpClient) {}

  get<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.execute<T>('GET', url, () => this.http.get(url, options as any) as Observable<T>);
  }

  post<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.execute<T>('POST', url, () => this.http.post(url, body, options as any) as Observable<T>);
  }

  put<T>(
    url: string,
    body: unknown,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.execute<T>('PUT', url, () => this.http.put(url, body, options as any) as Observable<T>);
  }

  delete<T>(
    url: string,
    options?: Omit<ApiRequestOptions, 'body'>,
  ): Observable<T> {
    return this.execute<T>('DELETE', url, () => this.http.delete(url, options as any) as Observable<T>);
  }

  request<T>(
    method: string,
    url: string,
    options?: ApiRequestOptions,
  ): Observable<T> {
    return this.execute<T>(method, url, () => this.http.request(method, url, options as any) as Observable<T>);
  }

  private execute<T>(method: string, url: string, call: () => Observable<T>): Observable<T> {
    try {
      return call().pipe(
        catchError((error: unknown) => throwError(() => this.toApiEngineError(error, method, url))),
      );
    } catch (error: unknown) {
      return throwError(() => this.toApiEngineError(error, method, url));
    }
  }

  private toApiEngineError(error: unknown, method: string, url: string): ApiEngineError {
    if (error instanceof ApiEngineError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const message = this.extractMessage(error.error) ?? this.buildFallbackHttpMessage(error.status, error.statusText);
      return new ApiEngineError(message, {
        method,
        url,
        status: error.status,
        statusText: error.statusText || 'Unknown Error',
        payload: error.error,
      });
    }

    if (error instanceof Error) {
      return new ApiEngineError(error.message, {
        method,
        url,
        status: 0,
        statusText: 'Client Error',
      });
    }

    return new ApiEngineError('Unexpected API error.', {
      method,
      url,
      status: 0,
      statusText: 'Unknown Error',
      payload: error,
    });
  }

  private extractMessage(payload: unknown): string | null {
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const candidate = payload as Record<string, unknown>;
      const message = candidate['message'];
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return null;
  }

  private buildFallbackHttpMessage(status: number, statusText: string): string {
    if (status > 0) {
      return `Request failed (${status} ${statusText || 'Unknown'}).`;
    }

    return 'Cannot connect to server.';
  }
}