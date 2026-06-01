import { Injectable } from '@angular/core';
import { Observable, of, concat, shareReplay, finalize, catchError } from 'rxjs';

export type OptionCachePolicy = 'cache-first' | 'network-first' | 'cache-and-network';

@Injectable({ providedIn: 'root' })
export class CacheDataSource {
  private inflight = new Map<string, Observable<any>>();

  query<T>(
    key: string,
    cached: { value: T; fetchedAt: number } | null,
    network$: Observable<{ value: T; fetchedAt: number }>,
    policy: OptionCachePolicy,
    staleTimeMs = 30_000,
  ): Observable<{ value: T; fetchedAt: number }> {
    const now = Date.now();
    const isStale = !!cached && now - cached.fetchedAt > staleTimeMs;

    const makeRequest = (): Observable<{ value: T; fetchedAt: number }> => {
      if (this.inflight.has(key)) {
        return this.inflight.get(key) as Observable<{ value: T; fetchedAt: number }>;
      }

      const request$ = network$.pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => {
          this.inflight.delete(key);
        }),
      );

      this.inflight.set(key, request$);
      return request$;
    };

    switch (policy) {
      case 'cache-first':
        if (cached && !isStale) {
          return of(cached);
        }
        if (cached && isStale) {
          return concat(of(cached), makeRequest());
        }
        return makeRequest();

      case 'cache-and-network':
        if (cached) {
          return concat(of(cached), makeRequest());
        }
        return makeRequest();

      case 'network-first':
      default:
        return makeRequest().pipe(
          catchError((err) => {
            if (cached) return of(cached);
            throw err;
          }),
        );
    }
  }
}
