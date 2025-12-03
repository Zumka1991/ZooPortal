import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';

export type ModerationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface GalleryUser {
  id: string;
  name: string;
}

export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  status: ModerationStatus;
  createdAt: string;
  user: GalleryUser;
}

export interface GalleryImageDetail extends GalleryImage {
  fileName?: string;
  moderationComment?: string;
  moderatedAt?: string;
  moderatedBy?: GalleryUser;
}

export interface GalleryPagedResponse {
  items: GalleryImage[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminGalleryPagedResponse {
  items: GalleryImageDetail[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

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

// Public API (no auth required for GET)
export const galleryApi = {
  getGallery: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<GalleryPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const query = searchParams.toString();
    const response = await fetch(`${API_URL}/gallery${query ? `?${query}` : ''}`);

    if (!response.ok) {
      throw new Error('Ошибка загрузки галереи');
    }

    return response.json();
  },

  getMyGallery: async (params?: {
    page?: number;
    pageSize?: number;
    status?: ModerationStatus;
  }): Promise<GalleryPagedResponse> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    const response = await fetch(`${API_URL}/gallery/my${query ? `?${query}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) {
        return galleryApi.getMyGallery(params);
      }
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      throw new Error('Ошибка загрузки галереи');
    }

    return response.json();
  },

  upload: async (title: string, file: File): Promise<GalleryImage> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);

    const response = await fetch(`${API_URL}/gallery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) {
        return galleryApi.upload(title, file);
      }
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка загрузки' }));
      throw new Error(error.message);
    }

    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Не авторизован');

    const response = await fetch(`${API_URL}/gallery/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) {
        return galleryApi.delete(id);
      }
      throw new Error('Не авторизован');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка удаления' }));
      throw new Error(error.message);
    }
  },
};

// Admin API
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
    if (refreshed) {
      return adminFetch(endpoint, options);
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const adminGalleryApi = {
  getAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: ModerationStatus;
    search?: string;
  }): Promise<AdminGalleryPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return adminFetch(`/admin/gallery${query ? `?${query}` : ''}`);
  },

  approve: async (id: string, comment?: string): Promise<GalleryImageDetail> => {
    return adminFetch(`/admin/gallery/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  reject: async (id: string, comment?: string): Promise<GalleryImageDetail> => {
    return adminFetch(`/admin/gallery/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },

  delete: async (id: string): Promise<void> => {
    return adminFetch(`/admin/gallery/${id}`, {
      method: 'DELETE',
    });
  },

  bulkApprove: async (ids: string[]): Promise<void> => {
    return adminFetch('/admin/gallery/bulk-approve', {
      method: 'POST',
      body: JSON.stringify(ids),
    });
  },

  bulkReject: async (ids: string[], comment?: string): Promise<void> => {
    return adminFetch('/admin/gallery/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ ids, comment }),
    });
  },
};
