'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  listingsApi,
  CreateListingRequest,
  ListingType,
  AnimalType,
  Gender,
  LISTING_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  GENDER_LABELS,
} from '@/lib/listings-api';
import { citiesApi, City, sheltersApi, ShelterListItem } from '@/lib/shelters-api';
import { useAuth } from '@/components/AuthProvider';

export default function NewListingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [cities, setCities] = useState<City[]>([]);
  const [myShelters, setMyShelters] = useState<ShelterListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateListingRequest>({
    title: '',
    description: '',
    animalType: 'Dog',
    breed: '',
    age: undefined,
    gender: undefined,
    type: 'Sale',
    price: undefined,
    cityId: '',
    contactPhone: '',
    shelterId: undefined,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    citiesApi.getCities().then(setCities).catch(console.error);
    sheltersApi.getMyShelters().then(setMyShelters).catch(() => setMyShelters([]));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.description || !formData.cityId) {
      setError('Заполните обязательные поля');
      return;
    }

    if (formData.type === 'Adoption' && !formData.shelterId) {
      setError('Для объявления типа "Из приюта" необходимо выбрать приют');
      return;
    }

    setLoading(true);
    try {
      const listing = await listingsApi.create(formData);
      router.push(`/listings/${listing.id}/edit?created=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания объявления');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const showShelterSelect = formData.type === 'Adoption' && myShelters.length > 0;
  const showPriceField = formData.type === 'Sale' || formData.type === 'Buy';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/listings" className="text-green-600 hover:text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к объявлениям
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Создать объявление</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип объявления *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: value as ListingType, shelterId: undefined }))}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      formData.type === value
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shelter Select (for Adoption) */}
            {showShelterSelect && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приют *
                </label>
                <select
                  name="shelterId"
                  value={formData.shelterId || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Выберите приют</option>
                  {myShelters.filter(s => s.moderationStatus === 'Approved').map((shelter) => (
                    <option key={shelter.id} value={shelter.id}>
                      {shelter.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.type === 'Adoption' && myShelters.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  У вас нет одобренных приютов. {' '}
                  <Link href="/shelters/new" className="underline">
                    Создайте приют
                  </Link>
                  , чтобы размещать объявления типа "Из приюта".
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Например: Продам щенка лабрадора"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* Animal Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип животного *
              </label>
              <select
                name="animalType"
                value={formData.animalType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Object.entries(ANIMAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Breed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Порода
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed || ''}
                onChange={handleChange}
                placeholder="Например: Лабрадор ретривер"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Возраст (месяцев)
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="12"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пол
                </label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Не указан</option>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price */}
            {showPriceField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'Buy' ? 'Готов заплатить до (руб.)' : 'Цена (руб.)'}
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="10000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Подробно опишите животное: характер, особенности, здоровье..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Город *
              </label>
              <select
                name="cityId"
                value={formData.cityId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}{city.region ? `, ${city.region}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Контактный телефон
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || (formData.type === 'Adoption' && myShelters.length === 0)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать объявление'}
              </button>
              <Link
                href="/listings"
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Отмена
              </Link>
            </div>

            <p className="text-sm text-gray-500 text-center">
              После создания объявление будет отправлено на модерацию
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
