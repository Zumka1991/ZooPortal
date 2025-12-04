import { authService } from './auth';
import { getApiUrl } from './api-url';

// === Types ===

export type AnimalType = 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rodent' | 'Reptile' | 'Other';
export type Gender = 'Male' | 'Female';
export type ListingType = 'Sale' | 'Buy' | 'GiveAway' | 'Adoption';
export type ListingStatus = 'Active' | 'Closed' | 'Expired' | 'Moderation';
export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ListingCity {
  id: string;
  name: string;
  region?: string;
}

export interface ListingOwner {
  id: string;
  name: string;
}

export interface ListingShelter {
  id: string;
  name: string;
  logoUrl?: string;
  isVerified: boolean;
}

export interface ListingImage {
  id: string;
  url: string;
  order: number;
}

export interface ListingListItem {
  id: string;
  title: string;
  animalType: AnimalType;
  breed?: string;
  age?: number;
  gender?: Gender;
  type: ListingType;
  price?: number;
  city: ListingCity;
  mainImageUrl?: string;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  isFavorite: boolean;
  likesCount: number;
  isLiked: boolean;
  shelter?: ListingShelter;
  createdAt: string;
  expiresAt: string;
}

export interface ListingDetail extends ListingListItem {
  description: string;
  contactPhone?: string;
  moderationComment?: string;
  moderatedAt?: string;
  owner: ListingOwner;
  images: ListingImage[];
  updatedAt?: string;
}

export interface ListingsPagedResponse {
  items: ListingListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminListingsPagedResponse {
  items: ListingDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  expiredCount: number;
}

export interface CreateListingRequest {
  title: string;
  description: string;
  animalType: AnimalType;
  breed?: string;
  age?: number;
  gender?: Gender;
  type: ListingType;
  price?: number;
  cityId: string;
  contactPhone?: string;
  shelterId?: string;
}

export interface UpdateListingRequest {
  title: string;
  description: string;
  animalType: AnimalType;
  breed?: string;
  age?: number;
  gender?: Gender;
  type: ListingType;
  price?: number;
  cityId: string;
  contactPhone?: string;
}

// === Labels ===

export const ANIMAL_TYPE_LABELS: Record<AnimalType, string> = {
  Dog: 'Собака',
  Cat: 'Кошка',
  Bird: 'Птица',
  Fish: 'Рыба',
  Rodent: 'Грызун',
  Reptile: 'Рептилия',
  Other: 'Другое',
};

export const ANIMAL_TYPE_ICONS: Record<AnimalType, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Fish: '🐟',
  Rodent: '🐹',
  Reptile: '🦎',
  Other: '🐾',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  Sale: 'Продажа',
  Buy: 'Куплю',
  GiveAway: 'Отдам бесплатно',
  Adoption: 'Из приюта',
};

export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  Sale: 'bg-green-100 text-green-800',
  Buy: 'bg-blue-100 text-blue-800',
  GiveAway: 'bg-purple-100 text-purple-800',
  Adoption: 'bg-orange-100 text-orange-800',
};

export const GENDER_LABELS: Record<Gender, string> = {
  Male: 'Мальчик',
  Female: 'Девочка',
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  Active: 'Активно',
  Closed: 'Закрыто',
  Expired: 'Истёк срок',
  Moderation: 'На модерации',
};

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
  Expired: 'bg-red-100 text-red-800',
  Moderation: 'bg-yellow-100 text-yellow-800',
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

// === Helper Functions ===

export function formatAge(months?: number): string {
  if (!months) return '';
  if (months < 12) {
    return `${months} мес.`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  }
  return `${years} г. ${remainingMonths} мес.`;
}

export function formatPrice(price?: number, type?: ListingType): string {
  if (type === 'GiveAway') return 'Бесплатно';
  if (!price) return 'Цена не указана';
  if (type === 'Buy') return `до ${price.toLocaleString('ru-RU')} ₽`;
  return `${price.toLocaleString('ru-RU')} ₽`;
}

// === Public Listings API ===

export const listingsApi = {
  getListings: async (params?: {
    type?: ListingType;
    animalType?: AnimalType;
    cityId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ListingsPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.animalType) searchParams.set('animalType', params.animalType);
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.minPrice) searchParams.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) searchParams.set('maxPrice', params.maxPrice.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    const response = await fetch(`${getApiUrl()}/listings${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Ошибка загрузки объявлений');
    return response.json();
  },

  getListing: async (id: string): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${getApiUrl()}/listings/${id}`, { headers });
    if (!response.ok) throw new Error('Объявление не найдено');
    return response.json();
  },

  getContact: async (id: string): Promise<{ contactPhone?: string }> => {
    const response = await fetch(`${getApiUrl()}/listings/${id}/contact`);
    if (!response.ok) throw new Error('Ошибка получения контакта');
    return response.json();
  },

  getMyListings: async (params?: {
    status?: ListingStatus;
    page?: number;
    pageSize?: number;
  }): Promise<ListingsPagedResponse> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    const response = await fetch(`${getApiUrl()}/listings/my${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return listingsApi.getMyListings(params);
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка загрузки');
    return response.json();
  },

  create: async (data: CreateListingRequest): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return listingsApi.create(data);
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка создания' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  update: async (id: string, data: UpdateListingRequest): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return listingsApi.update(id, data);
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка обновления' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  addImage: async (id: string, file: File): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${getApiUrl()}/listings/${id}/images`, {
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

    const response = await fetch(`${getApiUrl()}/listings/${id}/images/${imageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка удаления');
  },

  close: async (id: string): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${id}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка закрытия объявления');
    return response.json();
  },

  renew: async (id: string): Promise<ListingDetail> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${id}/renew`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка продления объявления');
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка удаления');
  },
};

// === Favorites API ===

export const favoritesApi = {
  getFavorites: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ListingsPagedResponse> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    const response = await fetch(`${getApiUrl()}/favorites${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return favoritesApi.getFavorites(params);
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка загрузки избранного');
    return response.json();
  },

  add: async (listingId: string): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/favorites/${listingId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return favoritesApi.add(listingId);
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка добавления в избранное');
  },

  remove: async (listingId: string): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/favorites/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Ошибка удаления из избранного');
  },

  check: async (ids: string[]): Promise<string[]> => {
    const token = authService.getAccessToken();
    if (!token) return [];

    const searchParams = new URLSearchParams();
    ids.forEach(id => searchParams.append('ids', id));

    const response = await fetch(`${getApiUrl()}/favorites/check?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return [];
    return response.json();
  },

  getCount: async (): Promise<number> => {
    const token = authService.getAccessToken();
    if (!token) return 0;

    const response = await fetch(`${getApiUrl()}/favorites/count`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return 0;
    return response.json();
  },
};

// === Likes API ===

export interface LikeResponse {
  likesCount: number;
  isLiked: boolean;
}

export const likesApi = {
  like: async (listingId: string): Promise<LikeResponse> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${listingId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return likesApi.like(listingId);
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка');
    return response.json();
  },

  unlike: async (listingId: string): Promise<LikeResponse> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${getApiUrl()}/listings/${listingId}/like`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return likesApi.unlike(listingId);
      throw new Error('Не авторизован');
    }

    if (!response.ok) throw new Error('Ошибка');
    return response.json();
  },

  getStatus: async (listingId: string): Promise<LikeResponse | null> => {
    const token = authService.getAccessToken();
    if (!token) return null;

    const response = await fetch(`${getApiUrl()}/listings/${listingId}/like-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return likesApi.getStatus(listingId);
      return null;
    }

    if (!response.ok) return null;
    return response.json();
  },
};

// === Admin Listings API ===

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

export const adminListingsApi = {
  getAll: async (params?: {
    status?: ModerationStatus;
    type?: ListingType;
    animalType?: AnimalType;
    cityId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminListingsPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.animalType) searchParams.set('animalType', params.animalType);
    if (params?.cityId) searchParams.set('cityId', params.cityId);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    return adminFetch(`/admin/listings${query ? `?${query}` : ''}`);
  },

  approve: async (id: string, comment?: string): Promise<ListingDetail> => {
    return adminFetch(`/admin/listings/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status: 'Approved', comment }),
    });
  },

  reject: async (id: string, comment: string): Promise<ListingDetail> => {
    return adminFetch(`/admin/listings/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ status: 'Rejected', comment }),
    });
  },

  bulkApprove: async (ids: string[], comment?: string): Promise<void> => {
    return adminFetch('/admin/listings/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids, comment }),
    });
  },

  bulkReject: async (ids: string[], comment: string): Promise<void> => {
    return adminFetch('/admin/listings/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, comment }),
    });
  },

  delete: async (id: string): Promise<void> => {
    return adminFetch(`/admin/listings/${id}`, { method: 'DELETE' });
  },
};
