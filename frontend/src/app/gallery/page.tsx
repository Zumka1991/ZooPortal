import { Metadata } from 'next';
import Link from 'next/link';
import { galleryApi } from '@/lib/gallery-api';
import { GalleryGrid } from '@/components/GalleryGrid';

export const metadata: Metadata = {
  title: 'Галерея питомцев | ZooPortal',
  description: 'Фотографии питомцев от нашего сообщества. Делитесь снимками своих любимцев!',
  openGraph: {
    title: 'Галерея питомцев | ZooPortal',
    description: 'Фотографии питомцев от нашего сообщества.',
  },
};

interface Props {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  let gallery;
  let error = '';

  try {
    gallery = await galleryApi.getGallery({
      page,
      pageSize: 16,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Ошибка загрузки';
    gallery = { items: [], totalCount: 0, page: 1, pageSize: 16, totalPages: 0 };
  }

  const { items, totalCount, totalPages } = gallery;

  const buildUrl = (newPage: number) => {
    return newPage > 1 ? `/gallery?page=${newPage}` : '/gallery';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Галерея питомцев</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            Делитесь фотографиями своих любимцев и смотрите на питомцев других участников
          </p>
          <Link
            href="/gallery/upload"
            className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Загрузить фото
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-gray-600">
              Всего фотографий: <span className="font-semibold text-gray-900">{totalCount}</span>
            </p>
          </div>
          <Link
            href="/gallery/my"
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Мои фотографии
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-8">
            {error}
          </div>
        )}

        {/* Gallery Grid */}
        <GalleryGrid images={items} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl(page - 1)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
              >
                ← Назад
              </Link>
            ) : (
              <span className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed">
                ← Назад
              </span>
            )}
            <span className="px-4 py-2 text-gray-600">
              Страница {page} из {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildUrl(page + 1)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
              >
                Далее →
              </Link>
            ) : (
              <span className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed">
                Далее →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
