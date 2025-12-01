import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: string;
  animalType?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  imageUrl?: string;
  category: string;
  animalType?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
  author: Author;
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ArticlesPagedResponse {
  items: ArticleListItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: ArticleCategory;
  animalType?: AnimalType;
  isPublished?: boolean;
}

export interface UpdateArticleRequest {
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  category: ArticleCategory;
  animalType?: AnimalType;
  isPublished: boolean;
}

export type ArticleCategory = 'Care' | 'Health' | 'Nutrition' | 'Training' | 'Breeds' | 'News';
export type AnimalType = 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rodent' | 'Reptile' | 'Other';

export const ARTICLE_CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'Care', label: 'Уход' },
  { value: 'Health', label: 'Здоровье' },
  { value: 'Nutrition', label: 'Питание' },
  { value: 'Training', label: 'Воспитание' },
  { value: 'Breeds', label: 'Породы' },
  { value: 'News', label: 'Новости' },
];

export const ANIMAL_TYPES: { value: AnimalType; label: string }[] = [
  { value: 'Dog', label: 'Собаки' },
  { value: 'Cat', label: 'Кошки' },
  { value: 'Bird', label: 'Птицы' },
  { value: 'Fish', label: 'Рыбы' },
  { value: 'Rodent', label: 'Грызуны' },
  { value: 'Reptile', label: 'Рептилии' },
  { value: 'Other', label: 'Другие' },
];

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

export const adminApi = {
  // Articles
  getArticles: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    isPublished?: boolean;
    search?: string;
  }): Promise<ArticlesPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.isPublished !== undefined) searchParams.set('isPublished', params.isPublished.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return adminFetch(`/admin/articles${query ? `?${query}` : ''}`);
  },

  getArticle: async (id: string): Promise<Article> => {
    return adminFetch(`/admin/articles/${id}`);
  },

  createArticle: async (data: CreateArticleRequest): Promise<Article> => {
    return adminFetch('/admin/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateArticle: async (id: string, data: UpdateArticleRequest): Promise<Article> => {
    return adminFetch(`/admin/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteArticle: async (id: string): Promise<void> => {
    return adminFetch(`/admin/articles/${id}`, {
      method: 'DELETE',
    });
  },

  publishArticle: async (id: string): Promise<Article> => {
    return adminFetch(`/admin/articles/${id}/publish`, {
      method: 'POST',
    });
  },

  unpublishArticle: async (id: string): Promise<Article> => {
    return adminFetch(`/admin/articles/${id}/unpublish`, {
      method: 'POST',
    });
  },
};
