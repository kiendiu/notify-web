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
    TEMPLATES_ALL: `${this.BASE_URL}/admin/campaigns/templates/all`,
    USERS_SEARCH: `${this.BASE_URL}/admin/users/search`,
    NOTIFICATIONS: (campaignId: string | number) => `${this.BASE_URL}/admin/campaigns/${campaignId}/notifications`,
    NOTIFICATION_DETAILS: (notificationId: string | number) => `${this.BASE_URL}/admin/campaigns/notifications/${notificationId}/details`,
    NOTIFICATION_RETRY: (notificationId: string | number) => `${this.BASE_URL}/admin/campaigns/${notificationId}/retry`,
  };

}