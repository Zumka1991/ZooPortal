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

export const CATEGORY_LABELS: Record<string, string> = {
  Care: 'Уход',
  Health: 'Здоровье',
  Nutrition: 'Питание',
  Training: 'Воспитание',
  Breeds: 'Породы',
  News: 'Новости',
};

export const ANIMAL_TYPE_LABELS: Record<string, string> = {
  Dog: 'Собаки',
  Cat: 'Кошки',
  Bird: 'Птицы',
  Fish: 'Рыбы',
  Rodent: 'Грызуны',
  Reptile: 'Рептилии',
  Other: 'Другие',
};

export const articlesApi = {
  getArticles: async (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    animalType?: string;
    search?: string;
  }): Promise<ArticlesPagedResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.animalType) searchParams.set('animalType', params.animalType);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    const response = await fetch(`${API_URL}/articles${query ? `?${query}` : ''}`);

    if (!response.ok) {
      throw new Error('Ошибка загрузки статей');
    }

    return response.json();
  },

  getArticleBySlug: async (slug: string): Promise<Article> => {
    const response = await fetch(`${API_URL}/articles/${slug}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Статья не найдена');
      }
      throw new Error('Ошибка загрузки статьи');
    }

    return response.json();
  },

  getRecentArticles: async (count = 5): Promise<ArticleListItem[]> => {
    const response = await fetch(`${API_URL}/articles/recent?count=${count}`);

    if (!response.ok) {
      throw new Error('Ошибка загрузки статей');
    }

    return response.json();
  },

  getPopularArticles: async (count = 5): Promise<ArticleListItem[]> => {
    const response = await fetch(`${API_URL}/articles/popular?count=${count}`);

    if (!response.ok) {
      throw new Error('Ошибка загрузки статей');
    }

    return response.json();
  },
};
