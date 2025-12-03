'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { sheltersApi, citiesApi, ShelterListItem, City } from '@/lib/shelters-api';
import { useAuth } from '@/components/AuthProvider';

export default function SheltersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [shelters, setShelters] = useState<ShelterListItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [cityId, setCityId] = useState(searchParams.get('cityId') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [sheltersRes, citiesRes] = await Promise.all([
        sheltersApi.getShelters({
          page,
          pageSize: 12,
          cityId: cityId || undefined,
          search: search || undefined,
        }),
        citiesApi.getCities(),
      ]);

      setShelters(sheltersRes.items);
      setTotalPages(sheltersRes.totalPages);
      setTotalCount(sheltersRes.totalCount);
      setCities(citiesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, [page, cityId, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateUrl = (newPage: number, newCityId: string, newSearch: string) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('page', newPage.toString());
    if (newCityId) params.set('cityId', newCityId);
    if (newSearch) params.set('search', newSearch);
    const query = params.toString();
    router.push(`/shelters${query ? `?${query}` : ''}`);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
    updateUrl(1, cityId, searchInput);
  };

  const handleCityChange = (newCityId: string) => {
    setCityId(newCityId);
    setPage(1);
    updateUrl(1, newCityId, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(newPage, cityId, search);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Приюты для животных</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Найдите приют рядом с вами и помогите бездомным животным обрести дом
          </p>
          {isAuthenticated && (
            <Link
              href="/shelters/new"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить приют
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Поиск по названию или адресу..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={cityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Все города</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}{city.region ? `, ${city.region}` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Найти
            </button>
          </div>
        </div>

        {/* Stats */}
        <p className="text-gray-600 mb-6">
          Найдено приютов: <span className="font-semibold text-gray-900">{totalCount}</span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-8">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Приюты не найдены</p>
            {isAuthenticated && (
              <Link
                href="/shelters/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Добавить первый приют
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelters.map((shelter) => (
              <Link
                key={shelter.id}
                href={`/shelters/${shelter.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {shelter.logoUrl ? (
                    <Image
                      src={shelter.logoUrl}
                      alt={shelter.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={shelter.logoUrl.includes('localhost')}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  {shelter.isVerified && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Проверен
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {shelter.name}
                  </h2>

                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {shelter.city.name}
                  </div>

                  {shelter.shortDescription && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {shelter.shortDescription}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center text-gray-600">
                        <span className="mr-1">🐕</span>
                        {shelter.dogsCount}
                      </span>
                      <span className="flex items-center text-gray-600">
                        <span className="mr-1">🐈</span>
                        {shelter.catsCount}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      Всего: {shelter.totalAnimals}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Назад
            </button>
            <span className="px-4 py-2 text-gray-600">
              Страница {page} из {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Далее →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
