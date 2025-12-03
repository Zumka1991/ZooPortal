import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface City {
  id: string;
  name: string;
  region?: string;
}

export interface ShelterImage {
  id: string;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ShelterOwner {
  id: string;
  name: string;
}

export interface ShelterListItem {
  id: string;
  name: string;
  shortDescription?: string;
  logoUrl?: string;
  city: City;
  address: string;
  phone?: string;
  totalAnimals: number;
  dogsCount: number;
  catsCount: number;
  isVerified: boolean;
  moderationStatus: ModerationStatus;
  createdAt: string;
}

export interface ShelterDetail extends ShelterListItem {
  description: string;
  latitude?: number;
  longitude?: number;
  phone2?: string;
  email?: string;
  website?: string;
  vkUrl?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  otherAnimalsCount: number;
  foundedYear?: number;
  volunteersCount?: number;
  workingHours?: string;
  acceptsVolunteers: boolean;
  needs?: string;
  donationCardNumber?: string;
  donationCardHolder?: string;
  donationPhone?: string;
  donationDetails?: string;
  isActive: boolean;
  moderationComment?: string;
  moderatedAt?: string;
  owner?: ShelterOwner;
  images: ShelterImage[];
  updatedAt?: string;
}

export interface SheltersPagedResponse {
  items: ShelterListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminSheltersPagedResponse {
  items: ShelterDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface CreateShelterRequest {
  name: string;
  description: string;
  shortDescription?: string;
  cityId: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  vkUrl?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  dogsCount: number;
  catsCount: number;
  otherAnimalsCount: number;
  foundedYear?: number;
  volunteersCount?: number;
  workingHours?: string;
  acceptsVolunteers: boolean;
  needs?: string;
  donationCardNumber?: string;
  donationCardHolder?: string;
  donationPhone?: string;
  donationDetails?: string;
}

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  Pending: 'На модерации',
  Approved: 'Одобрен',
  Rejected: 'Отклонён',
};

export const MODERATION_STATUS_COLORS: Record<ModerationStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

// Cities API
export const citiesApi = {
  getCities: async (): Promise<City[]> => {
    const response = await fetch(`${API_URL}/cities`);
    if (!response.ok) throw new Error('Ошибка загрузки городов');
    return response.json();
  },

  createCity: async (name: string, region?: string): Promise<City> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${API_URL}/cities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, region }),
    });
    if (!response.ok) throw new Error('Ошибка создания города');
    return response.json();
  },
};

// Public Shelters API
export const sheltersApi = {
  getShelters: async (params?: {
    page?: number;
    pageSize?: number;
    cityId?: string;
    search?: string;
    isVerified?: boolean;
  }): Promise<SheltersPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isVerified !== undefined) searchParams.set('isVerified', params.isVerified.toString());

    const query = searchParams.toString();
    const response = await fetch(`${API_URL}/shelters${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Ошибка загрузки приютов');
    return response.json();
  },

  getShelter: async (id: string): Promise<ShelterDetail> => {
    const response = await fetch(`${API_URL}/shelters/${id}`);
    if (!response.ok) throw new Error('Приют не найден');
    return response.json();
  },

  getMyShelters: async (): Promise<ShelterListItem[]> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${API_URL}/shelters/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return sheltersApi.getMyShelters();
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка загрузки');
    return response.json();
  },

  create: async (data: CreateShelterRequest): Promise<ShelterDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${API_URL}/shelters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return sheltersApi.create(data);
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка создания' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  update: async (id: string, data: CreateShelterRequest): Promise<ShelterDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${API_URL}/shelters/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return sheltersApi.update(id, data);
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка обновления' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  uploadLogo: async (id: string, file: File): Promise<ShelterDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/shelters/${id}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Ошибка загрузки логотипа');
    return response.json();
  },

  addImage: async (id: string, file: File, isMain: boolean = false): Promise<ShelterDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('isMain', isMain.toString());

    const response = await fetch(`${API_URL}/shelters/${id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Ошибка загрузки изображения');
    return response.json();
  },

  deleteImage: async (id: string, imageId: string): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${API_URL}/shelters/${id}/images/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка удаления');
  },
};

// Admin Shelters API
async function adminFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = authService.getAccessToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
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

export const adminSheltersApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: ModerationStatus;
    cityId?: string;
    isVerified?: boolean;
    search?: string;
  }): Promise<AdminSheltersPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.isVerified !== undefined) searchParams.set('isVerified', params.isVerified.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return adminFetch(`/admin/shelters${query ? `?${query}` : ''}`);
  },

  approve: async (id: string, comment?: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  reject: async (id: string, comment?: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  verify: async (id: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/verify`, { method: 'POST' });
  },

  unverify: async (id: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/unverify`, { method: 'POST' });
  },

  activate: async (id: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/activate`, { method: 'POST' });
  },

  deactivate: async (id: string): Promise<ShelterDetail> => {
    return adminFetch(`/admin/shelters/${id}/deactivate`, { method: 'POST' });
  },

  delete: async (id: string): Promise<void> => {
    return adminFetch(`/admin/shelters/${id}`, { method: 'DELETE' });
  },
};
