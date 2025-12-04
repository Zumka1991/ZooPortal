'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  listingsApi,
  ListingListItem,
  ListingType,
  AnimalType,
  LISTING_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
} from '@/lib/listings-api';
import { citiesApi, City } from '@/lib/shelters-api';
import { useAuth } from '@/components/AuthProvider';
import ListingCard from '@/components/ListingCard';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [listings, setListings] = useState<ListingListItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [type, setType] = useState<ListingType | ''>(searchParams.get('type') as ListingType || '');
  const [animalType, setAnimalType] = useState<AnimalType | ''>(searchParams.get('animalType') as AnimalType || '');
  const [cityId, setCityId] = useState(searchParams.get('cityId') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof listingsApi.getListings>[0] = { page, pageSize: 12 };
      if (type) params.type = type;
      if (animalType) params.animalType = animalType;
      if (cityId) params.cityId = cityId;
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await listingsApi.getListings(params);
      setListings(response.items);
      setTotalPages(response.totalPages);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  }, [page, type, animalType, cityId, debouncedSearch]);

  // Load listings when auth state is ready and when filters change
  useEffect(() => {
    if (!authLoading) {
      loadListings();
    }
  }, [loadListings, authLoading, isAuthenticated]);

  useEffect(() => {
    citiesApi.getCities().then(setCities).catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (type) params.set('type', type);
    if (animalType) params.set('animalType', animalType);
    if (cityId) params.set('cityId', cityId);
    if (debouncedSearch) params.set('search', debouncedSearch);
    const query = params.toString();
    router.replace(`/listings${query ? `?${query}` : ''}`, { scroll: false });
  }, [page, type, animalType, cityId, debouncedSearch, router]);

  const handleTypeChange = (value: string) => {
    setType(value as ListingType | '');
    setPage(1);
  };

  const handleAnimalTypeChange = (value: string) => {
    setAnimalType(value as AnimalType | '');
    setPage(1);
  };

  const handleCityChange = (value: string) => {
    setCityId(value);
    setPage(1);
  };

  const clearFilters = () => {
    setType('');
    setAnimalType('');
    setCityId('');
    setSearchInput('');
    setPage(1);
  };

  const hasFilters = type || animalType || cityId || searchInput;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Объявления о животных</h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">
              Найдите нового друга или отдайте питомца в добрые руки
            </p>
            {isAuthenticated && (
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать объявление
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию или породе..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Все типы</option>
              {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Animal Type Filter */}
            <select
              value={animalType}
              onChange={(e) => handleAnimalTypeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Все животные</option>
              {Object.entries(ANIMAL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={cityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Все города</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}{city.region ? `, ${city.region}` : ''}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Найдено: {totalCount} объявлений
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Объявления не найдены</h3>
            <p className="mt-2 text-gray-500">
              {hasFilters
                ? 'Попробуйте изменить параметры поиска'
                : 'Пока нет активных объявлений'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-green-600 hover:text-green-700"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 border rounded-lg ${
                        page === pageNum
                          ? 'bg-green-600 text-white border-green-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListingsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Объявления о животных</h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">
              Найдите нового друга или отдайте питомца в добрые руки
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<ListingsLoading />}>
      <ListingsContent />
    </Suspense>
  );
}
