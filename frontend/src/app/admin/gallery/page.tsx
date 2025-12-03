'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  adminGalleryApi,
  GalleryImageDetail,
  ModerationStatus,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/gallery-api';
import { ImageModal } from '@/components/ImageModal';

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImageDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('Pending');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedImage, setSelectedImage] = useState<GalleryImageDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await adminGalleryApi.getAll({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setImages(response.items);
      setTotalPages(response.totalPages);
      setCounts({
        pending: response.pendingCount,
        approved: response.approvedCount,
        rejected: response.rejectedCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleApprove = async (id: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await adminGalleryApi.approve(id);
      setImages((prev) => prev.map((img) => (img.id === id ? updated : img)));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved: prev.approved + 1,
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string, comment?: string) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await adminGalleryApi.reject(id, comment);
      setImages((prev) => prev.map((img) => (img.id === id ? updated : img)));
      setCounts((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        rejected: prev.rejected + 1,
      }));
      setShowRejectModal(null);
      setRejectComment('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это изображение навсегда?')) return;

    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await adminGalleryApi.delete(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      const img = images.find((i) => i.id === id);
      if (img) {
        setCounts((prev) => ({
          ...prev,
          [img.status.toLowerCase()]: prev[img.status.toLowerCase() as keyof typeof prev] - 1,
        }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    setProcessingIds(new Set(ids));
    try {
      await adminGalleryApi.bulkApprove(ids);
      loadImages();
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setProcessingIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация галереи</h1>
          <p className="text-gray-600 mt-1">Проверяйте и одобряйте фотографии пользователей</p>
        </div>
        <Link
          href="/admin"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Назад
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div
          onClick={() => { setStatusFilter('Pending'); setPage(1); }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${statusFilter === 'Pending' ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'bg-yellow-50 hover:bg-yellow-100'}`}
        >
          <div className="text-3xl font-bold text-yellow-700">{counts.pending}</div>
          <div className="text-yellow-600">На модерации</div>
        </div>
        <div
          onClick={() => { setStatusFilter('Approved'); setPage(1); }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${statusFilter === 'Approved' ? 'bg-green-100 ring-2 ring-green-400' : 'bg-green-50 hover:bg-green-100'}`}
        >
          <div className="text-3xl font-bold text-green-700">{counts.approved}</div>
          <div className="text-green-600">Одобрено</div>
        </div>
        <div
          onClick={() => { setStatusFilter('Rejected'); setPage(1); }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${statusFilter === 'Rejected' ? 'bg-red-100 ring-2 ring-red-400' : 'bg-red-50 hover:bg-red-100'}`}
        >
          <div className="text-3xl font-bold text-red-700">{counts.rejected}</div>
          <div className="text-red-600">Отклонено</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Поиск по названию или автору..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearch(searchInput);
                setPage(1);
              }
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Найти
        </button>
        <button
          onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput(''); setPage(1); }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Сбросить
        </button>

        {selectedIds.size > 0 && statusFilter === 'Pending' && (
          <button
            onClick={handleBulkApprove}
            disabled={processingIds.size > 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Одобрить выбранные ({selectedIds.size})
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Изображения не найдены</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          {statusFilter === 'Pending' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedIds.size === images.length && images.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span>Выбрать все на странице</span>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow ${selectedIds.has(image.id) ? 'ring-2 ring-purple-500' : ''}`}
              >
                {/* Select checkbox */}
                {statusFilter === 'Pending' && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(image.id)}
                      onChange={() => toggleSelect(image.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-gray-300 bg-white/90"
                    />
                  </div>
                )}

                {/* Image */}
                <div
                  className="aspect-square relative cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    unoptimized={image.imageUrl.includes('localhost')}
                  />
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${MODERATION_STATUS_COLORS[image.status]}`}>
                      {MODERATION_STATUS_LABELS[image.status]}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate text-sm" title={image.title}>
                    {image.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{image.user.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(image.createdAt)}</p>

                  {/* Actions */}
                  <div className="flex gap-1 mt-2">
                    {image.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(image.id)}
                          disabled={processingIds.has(image.id)}
                          className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {processingIds.has(image.id) ? '...' : 'Одобрить'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(image.id)}
                          disabled={processingIds.has(image.id)}
                          className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(image.id)}
                      disabled={processingIds.has(image.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
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

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.imageUrl}
          title={selectedImage.title}
          author={selectedImage.user.name}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Отклонить изображение</h3>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Причина отклонения (необязательно)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowRejectModal(null); setRejectComment(''); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Отмена
              </button>
              <button
                onClick={() => handleReject(showRejectModal, rejectComment || undefined)}
                disabled={processingIds.has(showRejectModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
