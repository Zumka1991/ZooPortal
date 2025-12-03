'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import {
  adminLostFoundApi,
  AdminLostFoundListItem,
  AdminLostFoundDetail,
  LostFoundType,
  ModerationStatus,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  LOST_FOUND_STATUS_LABELS,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/lost-found-api';
import { citiesApi, City } from '@/lib/shelters-api';

export default function AdminLostFoundPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<AdminLostFoundListItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<LostFoundType | ''>('');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const [selectedItem, setSelectedItem] = useState<AdminLostFoundDetail | null>(null);
  const [moderationComment, setModerationComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isModerator = user?.role === 'Moderator' || isAdmin;

  const loadData = useCallback(async () => {
    if (!isModerator) return;

    setIsLoading(true);
    setError('');

    try {
      const [itemsRes, citiesRes] = await Promise.all([
        adminLostFoundApi.getAll({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          search: search || undefined,
        }),
        citiesApi.getCities(),
      ]);

      setItems(itemsRes.items);
      setTotalPages(itemsRes.totalPages);
      setCounts({
        pending: itemsRes.pendingCount,
        approved: itemsRes.approvedCount,
        rejected: itemsRes.rejectedCount,
      });
      setCities(citiesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter, search, isModerator]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && isAuthenticated && !isModerator) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isModerator, router]);

  useEffect(() => {
    if (isModerator) {
      loadData();
    }
  }, [loadData, isModerator]);

  const openDetail = async (id: string) => {
    try {
      const detail = await adminLostFoundApi.getById(id);
      setSelectedItem(detail);
      setModerationComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminLostFoundApi.approve(id, moderationComment || undefined);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await adminLostFoundApi.reject(id, moderationComment || undefined);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить объявление? Это действие нельзя отменить.')) return;

    setActionLoading(true);
    try {
      await adminLostFoundApi.delete(id);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isModerator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Админ-панель
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Модерация потеряшек</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => { setStatusFilter('Pending'); setPage(1); }}
            className={`p-4 rounded-lg shadow transition-colors ${
              statusFilter === 'Pending' ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-white hover:bg-yellow-50'
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-gray-600">На модерации</div>
          </button>
          <button
            onClick={() => { setStatusFilter('Approved'); setPage(1); }}
            className={`p-4 rounded-lg shadow transition-colors ${
              statusFilter === 'Approved' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-white hover:bg-green-50'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            <div className="text-gray-600">Одобрено</div>
          </button>
          <button
            onClick={() => { setStatusFilter('Rejected'); setPage(1); }}
            className={`p-4 rounded-lg shadow transition-colors ${
              statusFilter === 'Rejected' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-white hover:bg-red-50'
            }`}
          >
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
            <div className="text-gray-600">Отклонено</div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as LostFoundType | ''); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все типы</option>
              <option value="Lost">Потеряны</option>
              <option value="Found">Найдены</option>
            </select>
            <input
              type="text"
              placeholder="Поиск по названию или автору..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setSearch(''); setPage(1); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Сбросить
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Объявления не найдены</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Объявление
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Город
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Автор
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          {item.mainImageUrl ? (
                            <Image
                              src={item.mainImageUrl}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized={item.mainImageUrl.includes('localhost')}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">{ANIMAL_TYPE_LABELS[item.animalType]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {LOST_FOUND_TYPE_LABELS[item.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.city.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[item.moderationStatus]}`}>
                        {MODERATION_STATUS_LABELS[item.moderationStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDetail(item.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Назад
            </button>
            <span className="px-4 py-2 text-gray-600">
              {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Images */}
                {selectedItem.images.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {selectedItem.images.map((img) => (
                      <div key={img.id} className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={img.url}
                          alt=""
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized={img.url.includes('localhost')}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Тип:</span>
                    <span className="ml-2 font-medium">{LOST_FOUND_TYPE_LABELS[selectedItem.type]}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Животное:</span>
                    <span className="ml-2 font-medium">{ANIMAL_TYPE_LABELS[selectedItem.animalType]}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Город:</span>
                    <span className="ml-2 font-medium">{selectedItem.city.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Дата:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedItem.eventDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Автор:</span>
                    <span className="ml-2 font-medium">{selectedItem.user.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{selectedItem.user.email}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
                  <p className="text-gray-700 text-sm">{selectedItem.description}</p>
                </div>

                {/* Current status */}
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${MODERATION_STATUS_COLORS[selectedItem.moderationStatus]}`}>
                    {MODERATION_STATUS_LABELS[selectedItem.moderationStatus]}
                  </span>
                </div>

                {selectedItem.moderationComment && (
                  <div className="p-3 bg-gray-100 rounded-lg mb-4">
                    <span className="text-sm text-gray-500">Комментарий модератора:</span>
                    <p className="text-gray-700">{selectedItem.moderationComment}</p>
                  </div>
                )}

                {/* Moderation comment */}
                {selectedItem.moderationStatus === 'Pending' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Комментарий (необязательно)
                    </label>
                    <textarea
                      value={moderationComment}
                      onChange={(e) => setModerationComment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Причина решения..."
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedItem.moderationStatus === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedItem.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleReject(selectedItem.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Отклонить
                      </button>
                    </>
                  )}

                  <Link
                    href={`/lost-found/${selectedItem.id}`}
                    target="_blank"
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Открыть страницу
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(selectedItem.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
