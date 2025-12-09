'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { citiesApi, City } from '@/lib/shelters-api';
import CitySelect from '@/components/CitySelect';
import {
  adminListingsApi,
  ListingDetail,
  ModerationStatus,
  ListingType,
  AnimalType,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
  LISTING_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  ANIMAL_TYPE_ICONS,
  formatAge,
  formatPrice,
} from '@/lib/listings-api';

export default function AdminListingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ListingType | ''>('');
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalType | ''>('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, expired: 0 });

  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null);
  const [moderationComment, setModerationComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkComment, setBulkComment] = useState('');

  const isAdmin = user?.role === 'Admin';
  const isModerator = user?.role === 'Moderator' || isAdmin;

  const loadData = useCallback(async () => {
    if (!isModerator) return;

    setIsLoading(true);
    setError('');

    try {
      const [listingsRes, citiesRes] = await Promise.all([
        adminListingsApi.getAll({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          animalType: animalTypeFilter || undefined,
          cityId: cityFilter || undefined,
          search: search || undefined,
        }),
        citiesApi.getCities(),
      ]);

      setListings(listingsRes.items);
      setTotalPages(listingsRes.totalPages);
      setCounts({
        pending: listingsRes.pendingCount,
        approved: listingsRes.approvedCount,
        rejected: listingsRes.rejectedCount,
        expired: listingsRes.expiredCount,
      });
      setCities(citiesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter, animalTypeFilter, cityFilter, search, isModerator]);

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

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminListingsApi.approve(id, moderationComment || undefined);
      setSelectedListing(null);
      setModerationComment('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!moderationComment) {
      setError('Укажите причину отклонения');
      return;
    }
    setActionLoading(true);
    try {
      await adminListingsApi.reject(id, moderationComment);
      setSelectedListing(null);
      setModerationComment('');
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
      await adminListingsApi.delete(id);
      setSelectedListing(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await adminListingsApi.bulkApprove(selectedIds, bulkComment || undefined);
      setSelectedIds([]);
      setBulkComment('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0 || !bulkComment) {
      setError('Укажите причину отклонения');
      return;
    }
    setActionLoading(true);
    try {
      await adminListingsApi.bulkReject(selectedIds, bulkComment);
      setSelectedIds([]);
      setBulkComment('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = listings.filter(l => l.moderationStatus === 'Pending').map(l => l.id);
    if (pendingIds.every(id => selectedIds.includes(id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
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
          <h1 className="text-3xl font-bold text-gray-900">Модерация объявлений</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`p-4 rounded-lg shadow transition-colors ${
              !statusFilter ? 'bg-gray-100 ring-2 ring-gray-500' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl font-bold text-gray-600">{counts.expired}</div>
            <div className="text-gray-600">Истёкших</div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as ListingType | ''); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все типы</option>
              {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={animalTypeFilter}
              onChange={(e) => { setAnimalTypeFilter(e.target.value as AnimalType | ''); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все животные</option>
              {Object.entries(ANIMAL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <CitySelect
              cities={cities}
              value={cityFilter}
              onChange={(value) => { setCityFilter(value); setPage(1); }}
              placeholder="Все города"
            />
            <button
              onClick={() => { setStatusFilter(''); setTypeFilter(''); setAnimalTypeFilter(''); setCityFilter(''); setSearch(''); setPage(1); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Сбросить
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <span className="text-blue-800 font-medium">
                Выбрано: {selectedIds.length}
              </span>
              <input
                type="text"
                placeholder="Комментарий (обязателен для отклонения)"
                value={bulkComment}
                onChange={(e) => setBulkComment(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Одобрить все
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={actionLoading || !bulkComment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Отклонить все
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Объявления не найдены</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {statusFilter === 'Pending' && (
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={listings.filter(l => l.moderationStatus === 'Pending').every(l => selectedIds.includes(l.id))}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Объявление
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Город
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    {statusFilter === 'Pending' && (
                      <td className="px-4 py-4">
                        {listing.moderationStatus === 'Pending' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(listing.id)}
                            onChange={() => toggleSelect(listing.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          {listing.images[0]?.url ? (
                            <img
                              src={listing.images[0].url}
                              alt={listing.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-2xl">
                              {ANIMAL_TYPE_ICONS[listing.animalType]}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ANIMAL_TYPE_LABELS[listing.animalType]}
                            {listing.breed && ` • ${listing.breed}`}
                            {listing.age && ` • ${formatAge(listing.age)}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {LISTING_TYPE_LABELS[listing.type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {listing.city.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(listing.price, listing.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[listing.moderationStatus]}`}>
                        {MODERATION_STATUS_LABELS[listing.moderationStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedListing(listing)}
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
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            <span className="px-4 py-2 text-gray-600">
              {page} из {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedListing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedListing.title}</h2>
                  <button
                    onClick={() => { setSelectedListing(null); setModerationComment(''); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Images */}
                  {selectedListing.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedListing.images.map((img, i) => (
                        <div key={img.id} className={`rounded-lg overflow-hidden ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover aspect-square"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Тип объявления:</span>
                      <span className="ml-2 font-medium">{LISTING_TYPE_LABELS[selectedListing.type]}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Животное:</span>
                      <span className="ml-2 font-medium">
                        {ANIMAL_TYPE_ICONS[selectedListing.animalType]} {ANIMAL_TYPE_LABELS[selectedListing.animalType]}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Порода:</span>
                      <span className="ml-2 font-medium">{selectedListing.breed || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Возраст:</span>
                      <span className="ml-2 font-medium">{selectedListing.age ? formatAge(selectedListing.age) : '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Город:</span>
                      <span className="ml-2 font-medium">{selectedListing.city.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Цена:</span>
                      <span className="ml-2 font-medium">{formatPrice(selectedListing.price, selectedListing.type)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Телефон:</span>
                      <span className="ml-2 font-medium">{selectedListing.contactPhone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Владелец:</span>
                      <span className="ml-2 font-medium">{selectedListing.owner?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Создано:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedListing.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Истекает:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedListing.expiresAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  {selectedListing.shelter && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm text-orange-800">
                        Объявление от приюта: <strong>{selectedListing.shelter.name}</strong>
                        {selectedListing.shelter.isVerified && ' (Верифицирован)'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedListing.description}</p>
                  </div>

                  {/* Current status */}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${MODERATION_STATUS_COLORS[selectedListing.moderationStatus]}`}>
                      {MODERATION_STATUS_LABELS[selectedListing.moderationStatus]}
                    </span>
                  </div>

                  {selectedListing.moderationComment && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Комментарий модератора:</span>
                      <p className="text-gray-700">{selectedListing.moderationComment}</p>
                    </div>
                  )}

                  {/* Moderation comment */}
                  {selectedListing.moderationStatus === 'Pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Комментарий (обязателен для отклонения)
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
                    {selectedListing.moderationStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedListing.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(selectedListing.id)}
                          disabled={actionLoading || !moderationComment}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Отклонить
                        </button>
                      </>
                    )}

                    <Link
                      href={`/listings/${selectedListing.id}`}
                      target="_blank"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Открыть страницу
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(selectedListing.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
