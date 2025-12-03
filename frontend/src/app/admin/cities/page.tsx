'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  adminCitiesApi,
  AdminCity,
  CitiesStats,
} from '@/lib/shelters-api';

export default function AdminCitiesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [cities, setCities] = useState<AdminCity[]>([]);
  const [stats, setStats] = useState<CitiesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [editingCity, setEditingCity] = useState<AdminCity | null>(null);
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedComplete, setSeedComplete] = useState(false);

  const isAdmin = user?.role === 'Admin';

  const loadData = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    setError('');

    try {
      const [citiesRes, statsRes] = await Promise.all([
        adminCitiesApi.getAll({
          page,
          pageSize: 50,
          search: search || undefined,
          isActive: activeFilter !== null ? activeFilter : undefined,
        }),
        adminCitiesApi.getStats(),
      ]);

      setCities(citiesRes.items);
      setTotalPages(citiesRes.totalPages);
      setStats(statsRes);

      // Если городов уже много, считаем что сид был выполнен
      if (statsRes.totalCount >= 50) {
        setSeedComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, activeFilter, isAdmin]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [loadData, isAdmin]);

  const handleSeedCities = async () => {
    if (seedComplete) return;

    setSeedLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await adminCitiesApi.seedRussianCities();
      setSuccessMessage(result.message);
      setSeedComplete(true);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    setAddLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await adminCitiesApi.create(newCityName.trim(), newCityRegion.trim() || undefined);
      setSuccessMessage(`Город "${newCityName}" добавлен`);
      setNewCityName('');
      setNewCityRegion('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (city: AdminCity) => {
    setEditingCity(city);
    setEditName(city.name);
    setEditRegion(city.region || '');
    setEditIsActive(city.isActive);
  };

  const handleUpdateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity || !editName.trim()) return;

    setEditLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await adminCitiesApi.update(editingCity.id, {
        name: editName.trim(),
        region: editRegion.trim() || undefined,
        isActive: editIsActive,
      });
      setSuccessMessage(`Город "${editName}" обновлен`);
      setEditingCity(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteCity = async (city: AdminCity) => {
    if (city.sheltersCount > 0 || city.listingsCount > 0) {
      setError('Невозможно удалить город с приютами или объявлениями. Деактивируйте его.');
      return;
    }

    if (!confirm(`Удалить город "${city.name}"? Это действие нельзя отменить.`)) return;

    setError('');
    setSuccessMessage('');

    try {
      await adminCitiesApi.delete(city.id);
      setSuccessMessage(`Город "${city.name}" удален`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
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
          <h1 className="text-3xl font-bold text-gray-900">Управление городами</h1>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-900">{stats.totalCount}</div>
              <div className="text-gray-600 text-sm">Всего городов</div>
            </div>
            <button
              onClick={() => { setActiveFilter(true); setPage(1); }}
              className={`p-4 rounded-lg shadow transition-colors text-left ${
                activeFilter === true ? 'bg-green-100 ring-2 ring-green-500' : 'bg-white hover:bg-green-50'
              }`}
            >
              <div className="text-2xl font-bold text-green-600">{stats.activeCount}</div>
              <div className="text-gray-600 text-sm">Активных</div>
            </button>
            <button
              onClick={() => { setActiveFilter(false); setPage(1); }}
              className={`p-4 rounded-lg shadow transition-colors text-left ${
                activeFilter === false ? 'bg-red-100 ring-2 ring-red-500' : 'bg-white hover:bg-red-50'
              }`}
            >
              <div className="text-2xl font-bold text-red-600">{stats.inactiveCount}</div>
              <div className="text-gray-600 text-sm">Неактивных</div>
            </button>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.withSheltersCount}</div>
              <div className="text-gray-600 text-sm">С приютами</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.withListingsCount}</div>
              <div className="text-gray-600 text-sm">С объявлениями</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <button
              onClick={handleSeedCities}
              disabled={seedLoading || seedComplete}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                seedComplete
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {seedLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Добавляем...
                </span>
              ) : seedComplete ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Города России добавлены
                </span>
              ) : (
                'Добавить все города России'
              )}
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showAddForm ? 'Отмена' : '+ Добавить город'}
            </button>

            <div className="flex-1" />

            <input
              type="text"
              placeholder="Поиск города..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />

            {activeFilter !== null && (
              <button
                onClick={() => { setActiveFilter(null); setPage(1); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Сбросить фильтр
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddCity} className="mt-4 pt-4 border-t flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Название города *"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 flex-1"
                required
              />
              <input
                type="text"
                placeholder="Регион (необязательно)"
                value={newCityRegion}
                onChange={(e) => setNewCityRegion(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 flex-1"
              />
              <button
                type="submit"
                disabled={addLoading || !newCityName.trim()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {addLoading ? 'Добавляем...' : 'Добавить'}
              </button>
            </form>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : cities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">Города не найдены</p>
            <p className="text-gray-400 mt-2">Нажмите "Добавить все города России" чтобы заполнить справочник</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Регион
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Приютов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Объявлений
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{city.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.region || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        city.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {city.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.sheltersCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.listingsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(city)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDeleteCity(city)}
                        disabled={city.sheltersCount > 0 || city.listingsCount > 0}
                        className={`${
                          city.sheltersCount > 0 || city.listingsCount > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={city.sheltersCount > 0 || city.listingsCount > 0 ? 'Нельзя удалить город с приютами или объявлениями' : ''}
                      >
                        Удалить
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

        {/* Edit Modal */}
        {editingCity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <form onSubmit={handleUpdateCity} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Редактировать город</h2>
                  <button
                    type="button"
                    onClick={() => setEditingCity(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Регион
                    </label>
                    <input
                      type="text"
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="editIsActive" className="text-sm text-gray-700">
                      Активен (отображается в списках выбора)
                    </label>
                  </div>

                  {(editingCity.sheltersCount > 0 || editingCity.listingsCount > 0) && (
                    <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      С этим городом связано: {editingCity.sheltersCount} приютов, {editingCity.listingsCount} объявлений
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingCity(null)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading || !editName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {editLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
