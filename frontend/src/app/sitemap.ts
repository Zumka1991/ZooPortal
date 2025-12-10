import { MetadataRoute } from 'next';
import { getApiUrl } from '@/lib/api-url';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

// Cache sitemap data for 6 hours to reduce API load from bots
const SITEMAP_REVALIDATE = 21600;

async function fetchShelters() {
  try {
    const response = await fetch(`${getApiUrl()}/shelters?pageSize=1000`, {
      next: { revalidate: SITEMAP_REVALIDATE }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchArticles() {
  try {
    const response = await fetch(`${getApiUrl()}/articles/public?pageSize=1000`, {
      next: { revalidate: SITEMAP_REVALIDATE }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchListings() {
  try {
    const response = await fetch(`${getApiUrl()}/listings?pageSize=1000`, {
      next: { revalidate: SITEMAP_REVALIDATE }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchPets() {
  try {
    const response = await fetch(`${getApiUrl()}/pets?pageSize=1000`, {
      next: { revalidate: SITEMAP_REVALIDATE }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchLostFound() {
  try {
    const response = await fetch(`${getApiUrl()}/lost-found?pageSize=1000`, {
      next: { revalidate: SITEMAP_REVALIDATE }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [shelters, articles, listings, pets, lostFound] = await Promise.all([
    fetchShelters(),
    fetchArticles(),
    fetchListings(),
    fetchPets(),
    fetchLostFound()
  ]);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/shelters`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/listings`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/lost-found`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pets`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contacts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic shelter pages
  const shelterPages: MetadataRoute.Sitemap = shelters.map((shelter: any) => ({
    url: `${BASE_URL}/shelters/${shelter.id}`,
    lastModified: shelter.updatedAt ? new Date(shelter.updatedAt) : new Date(shelter.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Dynamic article pages
  const articlePages: MetadataRoute.Sitemap = articles.map((article: any) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(article.publishedAt || article.createdAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Dynamic listing pages
  const listingPages: MetadataRoute.Sitemap = listings.map((listing: any) => ({
    url: `${BASE_URL}/listings/${listing.id}`,
    lastModified: listing.updatedAt ? new Date(listing.updatedAt) : new Date(listing.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Dynamic pet pages
  const petPages: MetadataRoute.Sitemap = pets.map((pet: any) => ({
    url: `${BASE_URL}/pets/${pet.id}`,
    lastModified: pet.updatedAt ? new Date(pet.updatedAt) : new Date(pet.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic lost-found pages
  const lostFoundPages: MetadataRoute.Sitemap = lostFound.map((item: any) => ({
    url: `${BASE_URL}/lost-found/${item.id}`,
    lastModified: new Date(item.createdAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...shelterPages,
    ...articlePages,
    ...listingPages,
    ...petPages,
    ...lostFoundPages,
  ];
}
