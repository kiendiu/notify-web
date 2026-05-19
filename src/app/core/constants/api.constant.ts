export class ApiConstant {

  static readonly BASE_URL =
    'http://localhost:8087/api';

  static readonly AUTH = {
    GOOGLE_LOGIN: `${this.BASE_URL}/auth/google-admin`,
    REFRESH_TOKEN: `${this.BASE_URL}/auth/refresh`,
  };

  static readonly CAMPAIGNS = {
    SEARCH: `${this.BASE_URL}/admin/campaigns/search`,
    CREATE: `${this.BASE_URL}/admin/campaigns/create`,
    TEMPLATES_ALL: `http://localhost:8087/api/admin/campaigns/templates/all`,
    TEMPLATES_PREVIEW: `${this.BASE_URL}/admin/campaigns/templates/preview`,
    USERS_SEARCH: `${this.BASE_URL}/admin/users/search`,
  };

}