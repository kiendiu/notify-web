export class ApiConstant {

  static readonly BASE_URL =
    'http://localhost:8087/api';

  static readonly AUTH = {
    GOOGLE_LOGIN: `${this.BASE_URL}/auth/google-admin`,
    REFRESH_TOKEN: `${this.BASE_URL}/auth/refresh`,
  };

}