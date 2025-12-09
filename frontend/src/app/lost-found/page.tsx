'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import {
  lostFoundApi,
  LostFoundListItem,
  LostFoundType,
  AnimalType,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
} from '@/lib/lost-found-api';
import { citiesApi, City } from '@/lib/shelters-api';
import CitySelect from '@/components/CitySelect';

// Динамический импорт карты
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />,
});

function LostFoundContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<LostFoundListItem[]>([]);
  const [mapItems, setMapItems] = useState<LostFoundListItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<LostFoundType | ''>('');
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalType | ''>('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [itemsRes, citiesRes] = await Promise.all([
        lostFoundApi.getAll({
          type: typeFilter || undefined,
          animalType: animalTypeFilter || undefined,
          cityId: cityFilter || undefined,
          search: search || undefined,
          page,
          pageSize: 12,
        }),
        citiesApi.getCities(),
      ]);

      setItems(itemsRes.items);
      setTotalPages(itemsRes.totalPages);
      setTotalCount(itemsRes.totalCount);
      setCities(citiesRes);

      // Загружаем данные для карты
      if (viewMode === 'map') {
        const mapData = await lostFoundApi.getForMap({
          type: typeFilter || undefined,
          animalType: animalTypeFilter || undefined,
          cityId: cityFilter || undefined,
        });
        setMapItems(mapData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, animalTypeFilter, cityFilter, search, page, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Загрузка данных карты при переключении вида
  useEffect(() => {
    if (viewMode === 'map' && mapItems.length === 0) {
      lostFoundApi.getForMap({
        type: typeFilter || undefined,
        animalType: animalTypeFilter || undefined,
        cityId: cityFilter || undefined,
      }).then(setMapItems);
    }
  }, [viewMode, typeFilter, animalTypeFilter, cityFilter, mapItems.length]);

  const resetFilters = () => {
    setTypeFilter('');
    setAnimalTypeFilter('');
    setCityFilter('');
    setSearch('');
    setPage(1);
  };

  const mapMarkers = mapItems
    .filter(item => item.latitude && item.longitude)
    .map(item => ({
      id: item.id,
      lat: item.latitude!,
      lng: item.longitude!,
      title: item.title,
      type: item.type.toLowerCase() as 'lost' | 'found',
      popupContent: (
        <div className="min-w-[200px]">
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-gray-500">
            {LOST_FOUND_TYPE_LABELS[item.type]} - {ANIMAL_TYPE_LABELS[item.animalType]}
          </div>
          <Link href={`/lost-found/${item.id}`} className="text-sm text-blue-600 hover:underline">
            Подробнее
          </Link>
        </div>
      ),
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Потеряшки</h1>
          <p className="text-gray-600 mt-1">
            Помогите найти потерявшихся питомцев или сообщите о найденном животном
          </p>
        </div>
        {isAuthenticated && (
          <Link
            href="/lost-found/new"
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить объявление
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Type filter */}
          <div className="flex gap-2">
            <button
              onClick={() => { setTypeFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !typeFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => { setTypeFilter('Lost'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === 'Lost' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Потеряны
            </button>
            <button
              onClick={() => { setTypeFilter('Found'); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === 'Found' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Найдены
            </button>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <select
              value={animalTypeFilter}
              onChange={(e) => { setAnimalTypeFilter(e.target.value as AnimalType | ''); setPage(1); }}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Все животные</option>
              {Object.entries(ANIMAL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <CitySelect
              cities={cities}
              value={cityFilter}
              onChange={(value) => { setCityFilter(value); setPage(1); }}
              placeholder="Все города"
            />

            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* View toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Список"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Карта"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>

          {(typeFilter || animalTypeFilter || cityFilter || search) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-gray-600">
        Найдено: {totalCount} {totalCount === 1 ? 'объявление' : totalCount < 5 ? 'объявления' : 'объявлений'}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Map
            markers={mapMarkers}
            height="500px"
            zoom={5}
            center={[55.7558, 37.6173]}
            onMarkerClick={(id) => router.push(`/lost-found/${id}`)}
          />
          <div className="p-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Потеряны</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Найдены</span>
              </div>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Объявления не найдены</p>
          {isAuthenticated && (
            <Link
              href="/lost-found/new"
              className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Добавить первое объявление
            </Link>
          )}
        </div>
      ) : (
        /* List View */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <LostFoundCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
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
        </>
      )}
    </div>
  );
}

function LostFoundCard({ item }: { item: LostFoundListItem }) {
  const isLost = item.type === 'Lost';

  return (
    <Link href={`/lost-found/${item.id}`} className="group">
      <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {item.mainImageUrl ? (
            <Image
              src={item.mainImageUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized={item.mainImageUrl.includes('localhost')}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Type badge */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
            isLost ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {isLost ? 'Потерян' : 'Найден'}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {ANIMAL_TYPE_LABELS[item.animalType]}
            {item.breed && ` - ${item.breed}`}
          </p>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{item.city.name}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(item.eventDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function LostFoundPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <LostFoundContent />
    </Suspense>
  );
}
