import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/my-pets/',
          '/listings/my',
          '/shelters/my',
          '/lost-found/my',
          '/gallery/my',
          '/messages/',
          '/favorites',
          '/become-admin',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
