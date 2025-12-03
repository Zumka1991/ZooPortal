'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { galleryApi, GalleryImage, ModerationStatus, MODERATION_STATUS_LABELS, MODERATION_STATUS_COLORS } from '@/lib/gallery-api';
import { ImageModal } from '@/components/ImageModal';

export default function MyGalleryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await galleryApi.getMyGallery({
        page,
        pageSize: 12,
        status: statusFilter || undefined,
      });
      setImages(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, statusFilter]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadImages();
    }
  }, [authLoading, isAuthenticated, loadImages]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это изображение?')) return;

    setDeletingId(id);
    try {
      await galleryApi.delete(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Требуется авторизация</h1>
          <p className="text-gray-600 mb-6">Войдите, чтобы просмотреть свои фотографии</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Мои фотографии</h1>
              <p className="text-gray-600 mt-1">Всего загружено: {totalCount}</p>
            </div>
            <Link
              href="/gallery/upload"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Загрузить
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href="/gallery"
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
          >
            ← Общая галерея
          </Link>
          <div className="flex-1" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ModerationStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">Все статусы</option>
            <option value="Pending">На модерации</option>
            <option value="Approved">Одобренные</option>
            <option value="Rejected">Отклоненные</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-8">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-4">У вас пока нет фотографий</p>
            <Link
              href="/gallery/upload"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Загрузить первую фотографию
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
              >
                <div
                  className="aspect-square relative cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized={image.imageUrl.includes('localhost')}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${MODERATION_STATUS_COLORS[image.status]}`}>
                      {MODERATION_STATUS_LABELS[image.status]}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate text-sm">{image.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(image.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={deletingId === image.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Удалить"
                    >
                      {deletingId === image.id ? (
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Назад
            </button>
            <span className="px-4 py-2 text-gray-600">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Далее →
            </button>
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.imageUrl}
          title={selectedImage.title}
          author={selectedImage.user.name}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}
