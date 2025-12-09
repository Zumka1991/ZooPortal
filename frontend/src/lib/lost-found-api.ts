import { authService } from './auth';
import { getApiUrl } from './api-url';

export type LostFoundType = 'Lost' | 'Found';
export type AnimalType = 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rodent' | 'Reptile' | 'Other';
export type LostFoundStatus = 'Active' | 'Resolved' | 'Closed';
export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

export const LOST_FOUND_TYPE_LABELS: Record<LostFoundType, string> = {
  Lost: 'Потерян',
  Found: 'Найден',
};

export const ANIMAL_TYPE_LABELS: Record<AnimalType, string> = {
  Dog: 'Собака',
  Cat: 'Кошка',
  Bird: 'Птица',
  Fish: 'Рыбка',
  Rodent: 'Грызун',
  Reptile: 'Рептилия',
  Other: 'Другое',
};

export const LOST_FOUND_STATUS_LABELS: Record<LostFoundStatus, string> = {
  Active: 'Активно',
  Resolved: 'Найден/Возвращён',
  Closed: 'Закрыто',
};

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  Pending: 'На модерации',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
};

export const MODERATION_STATUS_COLORS: Record<ModerationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

export interface City {
  id: string;
  name: string;
  region?: string;
}

export interface LostFoundImage {
  id: string;
  url: string;
  order: number;
}

export interface LostFoundUser {
  id: string;
  name: string;
}

export interface LostFoundListItem {
  id: string;
  title: string;
  type: LostFoundType;
  animalType: AnimalType;
  breed?: string;
  color?: string;
  city: City;
  address?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;
  status: LostFoundStatus;
  mainImageUrl?: string;
  createdAt: string;
}

export interface LostFoundDetail extends LostFoundListItem {
  description: string;
  distinctiveFeatures?: string;
  contactPhone?: string;
  moderationStatus: ModerationStatus;
  moderationComment?: string;
  user: LostFoundUser;
  images: LostFoundImage[];
}

export interface MyLostFoundItem {
  id: string;
  title: string;
  type: LostFoundType;
  animalType: AnimalType;
  city: City;
  eventDate: string;
  status: LostFoundStatus;
  moderationStatus: ModerationStatus;
  moderationComment?: string;
  mainImageUrl?: string;
  createdAt: string;
}

export interface LostFoundPagedResponse {
  items: LostFoundListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateLostFoundRequest {
  title: string;
  description: string;
  type: LostFoundType;
  animalType: AnimalType;
  breed?: string;
  color?: string;
  distinctiveFeatures?: string;
  cityId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;
  contactPhone?: string;
}

export interface UpdateLostFoundRequest {
  title: string;
  description: string;
  animalType: AnimalType;
  breed?: string;
  color?: string;
  distinctiveFeatures?: string;
  cityId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  eventDate: string;
  contactPhone?: string;
}

// Public API
export const lostFoundApi = {
  getAll: async (params?: {
    type?: LostFoundType;
    animalType?: AnimalType;
    cityId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<LostFoundPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.animalType) searchParams.set('animalType', params.animalType);
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    const response = await fetch(`${getApiUrl()}/lost-found${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Ошибка загрузки');
    return response.json();
  },

  getForMap: async (params?: {
    type?: LostFoundType;
    animalType?: AnimalType;
    cityId?: string;
  }): Promise<LostFoundListItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.animalType) searchParams.set('animalType', params.animalType);
    if (params?.cityId) searchParams.set('cityId', params.cityId);

    const query = searchParams.toString();
    const response = await fetch(`${getApiUrl()}/lost-found/map${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Ошибка загрузки');
    return response.json();
  },

  getById: async (id: string): Promise<LostFoundDetail> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Запись не найдена');
    return response.json();
  },

  getMy: async (): Promise<MyLostFoundItem[]> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Ошибка загрузки');
    return response.json();
  },

  create: async (data: CreateLostFoundRequest): Promise<LostFoundDetail> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    // If 401, try to refresh token and retry
    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) {
        const newToken = authService.getAccessToken();
        const retryResponse = await fetch(`${getApiUrl()}/lost-found`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify(data),
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ message: 'Ошибка создания' }));
          throw new Error(error.message);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка создания' }));
      throw new Error(error.message);
    }
    return response.json();
  },

  update: async (id: string, data: UpdateLostFoundRequest): Promise<LostFoundDetail> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка обновления' }));
      throw new Error(error.message);
    }
    return response.json();
  },

  resolve: async (id: string): Promise<void> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/${id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Ошибка');
  },

  delete: async (id: string): Promise<void> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Ошибка удаления');
  },

  uploadImage: async (id: string, file: File): Promise<LostFoundImage> => {
    const token = authService.getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${getApiUrl()}/lost-found/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      throw new Error(error.message);
    }
    return response.json();
  },

  deleteImage: async (id: string, imageId: string): Promise<void> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/lost-found/${id}/images/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Ошибка удаления');
  },
};

// Admin API
async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = authService.getAccessToken();

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    const refreshed = await authService.refresh();
    if (refreshed) return adminFetch(endpoint, options);
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface AdminLostFoundUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminLostFoundListItem {
  id: string;
  title: string;
  type: LostFoundType;
  animalType: AnimalType;
  breed?: string;
  city: City;
  eventDate: string;
  status: LostFoundStatus;
  moderationStatus: ModerationStatus;
  moderationComment?: string;
  user: AdminLostFoundUser;
  mainImageUrl?: string;
  createdAt: string;
}

export interface AdminLostFoundDetail extends AdminLostFoundListItem {
  description: string;
  color?: string;
  distinctiveFeatures?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  moderatedAt?: string;
  images: LostFoundImage[];
}

export interface AdminLostFoundPagedResponse {
  items: AdminLostFoundListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export const adminLostFoundApi = {
  getAll: async (params?: {
    status?: ModerationStatus;
    type?: LostFoundType;
    cityId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminLostFoundPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return adminFetch(`/admin/lost-found${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<AdminLostFoundDetail> => {
    return adminFetch(`/admin/lost-found/${id}`);
  },

  approve: async (id: string, comment?: string): Promise<void> => {
    return adminFetch(`/admin/lost-found/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  reject: async (id: string, comment?: string): Promise<void> => {
    return adminFetch(`/admin/lost-found/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  delete: async (id: string): Promise<void> => {
    return adminFetch(`/admin/lost-found/${id}`, { method: 'DELETE' });
  },
};
