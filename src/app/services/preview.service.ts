import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConstant } from '../core/constants/api.constant';
import {
  TemplateDto,
  UsersSearchResponse,
} from '../management/stores/preview/preview.state';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  constructor(private http: HttpClient) {}

  getAllTemplates(): Observable<TemplateDto[]> {
    return this.http.get<TemplateDto[]>(
      ApiConstant.CAMPAIGNS.TEMPLATES_ALL,
    );
  }

  searchUsers(keyword: string, page: number, size: number): Observable<UsersSearchResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (keyword?.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    return this.http.get<UsersSearchResponse>(
      ApiConstant.CAMPAIGNS.USERS_SEARCH,
      { params },
    );
  }
}