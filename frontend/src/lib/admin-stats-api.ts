import { authService } from './auth';
import { getApiUrl } from './api-url';

export interface AdminStats {
  articlesCount: number;
  galleryCount: number;
  listingsCount: number;
  lostFoundCount: number;
  sheltersCount: number;
  citiesCount: number;
}

export const adminStatsApi = {
  getStats: async (): Promise<AdminStats> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) {
        return adminStatsApi.getStats();
      }
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      throw new Error('Ошибка загрузки статистики');
    }

    return response.json();
  },
};
