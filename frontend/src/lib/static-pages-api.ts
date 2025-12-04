import { getApiUrl } from './api-url';

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt?: string;
  lastEditedBy?: { id: string; name: string };
}

export const staticPagesApi = {
  getBySlug: async (slug: string): Promise<StaticPage> => {
    const response = await fetch(`${getApiUrl()}/static-pages/${slug}`);
    if (!response.ok) {
      throw new Error('Page not found');
    }
    return response.json();
  }
};
