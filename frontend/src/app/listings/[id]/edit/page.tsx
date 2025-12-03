'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  listingsApi,
  ListingDetail,
  UpdateListingRequest,
  ListingType,
  AnimalType,
  Gender,
  LISTING_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  GENDER_LABELS,
  MODERATION_STATUS_COLORS,
  MODERATION_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
} from '@/lib/listings-api';
import { citiesApi, City } from '@/lib/shelters-api';
import { useAuth } from '@/components/AuthProvider';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const justCreated = searchParams.get('created') === 'true';

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(justCreated ? 'Объявление создано и отправлено на модерацию' : null);

  const [formData, setFormData] = useState<UpdateListingRequest>({
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
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const loadListing = useCallback(async () => {
    try {
      const data = await listingsApi.getListing(id);
      setListing(data);
      setFormData({
        title: data.title,
        description: data.description,
        animalType: data.animalType,
        breed: data.breed || '',
        age: data.age,
        gender: data.gender,
        type: data.type,
        price: data.price,
        cityId: data.city.id,
        contactPhone: data.contactPhone || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    loadListing();
    citiesApi.getCities().then(setCities).catch(console.error);
  }, [loadListing]);

  useEffect(() => {
    if (listing && user && listing.owner.id !== user.id) {
      router.push('/listings');
    }
  }, [listing, user, router]);

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
    setSuccess(null);

    if (!formData.title || !formData.description || !formData.cityId) {
      setError('Заполните обязательные поля');
      return;
    }

    setSaving(true);
    try {
      const updated = await listingsApi.update(id, formData);
      setListing(updated);
      setSuccess('Изменения сохранены');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    try {
      const updated = await listingsApi.addImage(id, file);
      setListing(updated);
      setSuccess('Изображение добавлено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (imageId: string) => {
    if (!confirm('Удалить это изображение?')) return;

    setDeletingImage(imageId);
    setError(null);
    try {
      await listingsApi.deleteImage(id, imageId);
      setListing((prev) =>
        prev ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) } : null
      );
      setSuccess('Изображение удалено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeletingImage(null);
    }
  };

  const handleClose = async () => {
    if (!confirm('Закрыть объявление? Оно станет неактивным.')) return;

    setError(null);
    try {
      const updated = await listingsApi.close(id);
      setListing(updated);
      setSuccess('Объявление закрыто');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleRenew = async () => {
    setError(null);
    try {
      const updated = await listingsApi.renew(id);
      setListing(updated);
      setSuccess('Объявление продлено на 30 дней');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка продления');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить объявление? Это действие нельзя отменить.')) return;

    setError(null);
    try {
      await listingsApi.delete(id);
      router.push('/listings/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Объявление не найдено</h1>
          <Link href="/listings" className="text-green-600 hover:text-green-700">
            Вернуться к объявлениям
          </Link>
        </div>
      </div>
    );
  }

  const showPriceField = formData.type === 'Sale' || formData.type === 'Buy';
  const canEdit = listing.status !== 'Closed';
  const canRenew = listing.status === 'Expired' || listing.status === 'Active';
  const daysUntilExpiry = Math.ceil(
    (new Date(listing.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/listings/my"
            className="text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Мои объявления
          </Link>

          <Link
            href={`/listings/${id}`}
            className="text-gray-600 hover:text-gray-700 flex items-center gap-2"
          >
            Просмотр
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Moderation Status */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Статус модерации</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${MODERATION_STATUS_COLORS[listing.moderationStatus]}`}>
              {MODERATION_STATUS_LABELS[listing.moderationStatus]}
            </span>
            {listing.moderationComment && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Комментарий:</span> {listing.moderationComment}
              </p>
            )}
          </div>

          {/* Listing Status */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Статус объявления</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${LISTING_STATUS_COLORS[listing.status]}`}>
              {LISTING_STATUS_LABELS[listing.status]}
            </span>
            {listing.status === 'Active' && daysUntilExpiry > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {daysUntilExpiry <= 7 ? (
                  <span className="text-orange-600">Истекает через {daysUntilExpiry} дней</span>
                ) : (
                  <span>Активно ещё {daysUntilExpiry} дней</span>
                )}
              </p>
            )}
            {listing.status === 'Expired' && (
              <p className="mt-2 text-sm text-red-600">Срок истёк. Продлите объявление.</p>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Images Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Фотографии</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {listing.images.map((image) => (
              <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {canEdit && (
                  <button
                    onClick={() => handleImageDelete(image.id)}
                    disabled={deletingImage === image.id}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                  >
                    {deletingImage === image.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}

            {/* Upload Button */}
            {canEdit && listing.images.length < 10 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-2">Добавить</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {listing.images.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Добавьте фотографии, чтобы объявление было привлекательнее
            </p>
          )}
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6">Редактировать объявление</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип объявления
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(LISTING_TYPE_LABELS)
                  .filter(([value]) => value !== 'Adoption' || listing.type === 'Adoption')
                  .map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!canEdit || listing.type === 'Adoption'}
                      onClick={() => setFormData((prev) => ({ ...prev, type: value as ListingType }))}
                      className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        formData.type === value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {label}
                    </button>
                  ))}
              </div>
              {listing.type === 'Adoption' && (
                <p className="mt-2 text-sm text-gray-500">
                  Тип &quot;Из приюта&quot; нельзя изменить
                </p>
              )}
            </div>

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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                  disabled={!canEdit}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                  disabled={!canEdit}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                  disabled={!canEdit}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              )}

              {canRenew && (
                <button
                  type="button"
                  onClick={handleRenew}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Продлить на 30 дней
                </button>
              )}

              {listing.status === 'Active' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Закрыть объявление
                </button>
              )}

              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 text-red-600 hover:text-red-700 font-medium ml-auto"
              >
                Удалить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
