'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  adminSheltersApi,
  citiesApi,
  ShelterDetail,
  City,
  ModerationStatus,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/shelters-api';
import CitySelect from '@/components/CitySelect';

export default function AdminSheltersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [shelters, setShelters] = useState<ShelterDetail[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const [selectedShelter, setSelectedShelter] = useState<ShelterDetail | null>(null);
  const [moderationComment, setModerationComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === 'Admin';
  const isModerator = user?.role === 'Moderator' || isAdmin;

  const loadData = useCallback(async () => {
    if (!isModerator) return;

    setIsLoading(true);
    setError('');

    try {
      const [sheltersRes, citiesRes] = await Promise.all([
        adminSheltersApi.getAll({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
          cityId: cityFilter || undefined,
          search: search || undefined,
        }),
        citiesApi.getCities(),
      ]);

      setShelters(sheltersRes.items);
      setTotalPages(sheltersRes.totalPages);
      setCounts({
        pending: sheltersRes.pendingCount,
        approved: sheltersRes.approvedCount,
        rejected: sheltersRes.rejectedCount,
      });
      setCities(citiesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, cityFilter, search, isModerator]);

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
      await adminSheltersApi.approve(id, moderationComment || undefined);
      setSelectedShelter(null);
      setModerationComment('');
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
      await adminSheltersApi.reject(id, moderationComment || undefined);
      setSelectedShelter(null);
      setModerationComment('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (id: string, verify: boolean) => {
    setActionLoading(true);
    try {
      if (verify) {
        await adminSheltersApi.verify(id);
      } else {
        await adminSheltersApi.unverify(id);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить приют? Это действие нельзя отменить.')) return;

    setActionLoading(true);
    try {
      await adminSheltersApi.delete(id);
      setSelectedShelter(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Модерация приютов</h1>
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
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <CitySelect
              cities={cities}
              value={cityFilter}
              onChange={(value) => { setCityFilter(value); setPage(1); }}
              placeholder="Все города"
            />
            <button
              onClick={() => { setStatusFilter(''); setCityFilter(''); setSearch(''); setPage(1); }}
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
        ) : shelters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Приюты не найдены</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Приют
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Город
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Верификация
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Животных
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shelters.map((shelter) => (
                  <tr key={shelter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                          {shelter.logoUrl ? (
                            <Image
                              src={shelter.logoUrl}
                              alt={shelter.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized={shelter.logoUrl.includes('localhost')}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{shelter.name}</div>
                          <div className="text-sm text-gray-500">{shelter.owner?.name || 'Без владельца'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shelter.city.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[shelter.moderationStatus]}`}>
                        {MODERATION_STATUS_LABELS[shelter.moderationStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {shelter.isVerified ? (
                        <span className="flex items-center text-blue-600">
                          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Проверен
                        </span>
                      ) : (
                        <span className="text-gray-400">Нет</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shelter.totalAnimals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedShelter(shelter)}
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
        {selectedShelter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedShelter.name}</h2>
                  <button
                    onClick={() => setSelectedShelter(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Logo */}
                  {selectedShelter.logoUrl && (
                    <div className="w-full h-48 relative rounded-lg overflow-hidden">
                      <Image
                        src={selectedShelter.logoUrl}
                        alt={selectedShelter.name}
                        fill
                        className="object-cover"
                        unoptimized={selectedShelter.logoUrl.includes('localhost')}
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Город:</span>
                      <span className="ml-2 font-medium">{selectedShelter.city.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Адрес:</span>
                      <span className="ml-2 font-medium">{selectedShelter.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Телефон:</span>
                      <span className="ml-2 font-medium">{selectedShelter.phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{selectedShelter.email || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Владелец:</span>
                      <span className="ml-2 font-medium">{selectedShelter.owner?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Создан:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedShelter.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
                    <p className="text-gray-700 text-sm">{selectedShelter.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg flex-1">
                      <div className="text-xl font-bold text-blue-600">{selectedShelter.dogsCount}</div>
                      <div className="text-xs text-gray-600">Собак</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg flex-1">
                      <div className="text-xl font-bold text-purple-600">{selectedShelter.catsCount}</div>
                      <div className="text-xs text-gray-600">Кошек</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg flex-1">
                      <div className="text-xl font-bold text-green-600">{selectedShelter.otherAnimalsCount}</div>
                      <div className="text-xs text-gray-600">Других</div>
                    </div>
                  </div>

                  {/* Current status */}
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${MODERATION_STATUS_COLORS[selectedShelter.moderationStatus]}`}>
                      {MODERATION_STATUS_LABELS[selectedShelter.moderationStatus]}
                    </span>
                    {selectedShelter.isVerified && (
                      <span className="flex items-center text-blue-600 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Верифицирован
                      </span>
                    )}
                  </div>

                  {selectedShelter.moderationComment && (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">Комментарий модератора:</span>
                      <p className="text-gray-700">{selectedShelter.moderationComment}</p>
                    </div>
                  )}

                  {/* Moderation comment */}
                  {selectedShelter.moderationStatus === 'Pending' && (
                    <div>
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
                    {selectedShelter.moderationStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedShelter.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(selectedShelter.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Отклонить
                        </button>
                      </>
                    )}

                    {isAdmin && selectedShelter.moderationStatus === 'Approved' && (
                      <>
                        {selectedShelter.isVerified ? (
                          <button
                            onClick={() => handleVerify(selectedShelter.id, false)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                          >
                            Снять верификацию
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(selectedShelter.id, true)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Верифицировать
                          </button>
                        )}
                      </>
                    )}

                    <Link
                      href={`/shelters/${selectedShelter.id}`}
                      target="_blank"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Открыть страницу
                    </Link>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(selectedShelter.id)}
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
          </div>
        )}
      </div>
    </div>
  );
}
