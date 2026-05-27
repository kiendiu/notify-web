import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class SearchService {
  private readonly search$ = new BehaviorSubject<string>('');

  setSearch(value: string): void {
    this.search$.next(value ?? '');
  }

  getSearch(): Observable<string> {
    return this.search$.asObservable();
  }
}
