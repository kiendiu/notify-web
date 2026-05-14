import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export abstract class BaseApiService {
  protected http = inject(HttpClient);

  protected get<T>(url: string) {
    return this.http.get<T>(url);
  }

  protected post<T>(url: string, body: unknown) {
    return this.http.post<T>(url, body);
  }

  protected put<T>(url: string, body: unknown) {
    return this.http.put<T>(url, body);
  }

  protected delete<T>(url: string) {
    return this.http.delete<T>(url);
  }
}