'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  sheltersApi,
  citiesApi,
  City,
  ShelterDetail,
  CreateShelterRequest,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/shelters-api';

export default function EditShelterPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNewlyCreated = searchParams.get('created') === 'true';
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [shelter, setShelter] = useState<ShelterDetail | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateShelterRequest>({
    name: '',
    description: '',
    shortDescription: '',
    cityId: '',
    address: '',
    phone: '',
    phone2: '',
    email: '',
    website: '',
    vkUrl: '',
    telegramUrl: '',
    instagramUrl: '',
    dogsCount: 0,
    catsCount: 0,
    otherAnimalsCount: 0,
    foundedYear: undefined,
    volunteersCount: undefined,
    workingHours: '',
    acceptsVolunteers: false,
    needs: '',
    donationCardNumber: '',
    donationCardHolder: '',
    donationPhone: '',
    donationDetails: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;

      try {
        const [shelterData, citiesData] = await Promise.all([
          sheltersApi.getShelter(id),
          citiesApi.getCities(),
        ]);

        setShelter(shelterData);
        setCities(citiesData);

        setFormData({
          name: shelterData.name,
          description: shelterData.description,
          shortDescription: shelterData.shortDescription || '',
          cityId: shelterData.city.id,
          address: shelterData.address,
          phone: shelterData.phone || '',
          phone2: shelterData.phone2 || '',
          email: shelterData.email || '',
          website: shelterData.website || '',
          vkUrl: shelterData.vkUrl || '',
          telegramUrl: shelterData.telegramUrl || '',
          instagramUrl: shelterData.instagramUrl || '',
          dogsCount: shelterData.dogsCount,
          catsCount: shelterData.catsCount,
          otherAnimalsCount: shelterData.otherAnimalsCount,
          foundedYear: shelterData.foundedYear,
          volunteersCount: shelterData.volunteersCount,
          workingHours: shelterData.workingHours || '',
          acceptsVolunteers: shelterData.acceptsVolunteers,
          needs: shelterData.needs || '',
          donationCardNumber: shelterData.donationCardNumber || '',
          donationCardHolder: shelterData.donationCardHolder || '',
          donationPhone: shelterData.donationPhone || '',
          donationDetails: shelterData.donationDetails || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [id, isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.description || !formData.cityId || !formData.address) {
      setError('Заполните обязательные поля');
      return;
    }

    setIsSaving(true);

    try {
      const updated = await sheltersApi.update(id, formData);
      setShelter(updated);
      setSuccess('Изменения сохранены! Если приют был одобрен, он останется в каталоге с обновлённой информацией.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await sheltersApi.uploadLogo(id, file);
      setShelter(updated);
      setSuccess('Логотип обновлён');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await sheltersApi.addImage(id, file);
      setShelter(updated);
      setSuccess('Изображение добавлено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Удалить изображение?')) return;

    try {
      await sheltersApi.deleteImage(id, imageId);
      setShelter(prev => prev ? {
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      } : null);
      setSuccess('Изображение удалено');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !shelter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Приют не найден</h1>
          <Link href="/shelters/my" className="text-blue-600 hover:underline">
            К моим приютам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/shelters/my" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Мои приюты
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Редактирование приюта</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[shelter.moderationStatus]}`}>
              {MODERATION_STATUS_LABELS[shelter.moderationStatus]}
            </span>
            {shelter.isVerified && (
              <span className="flex items-center text-blue-600 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Верифицирован
              </span>
            )}
          </div>
          {shelter.moderationComment && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Комментарий модератора:</strong> {shelter.moderationComment}
              </p>
            </div>
          )}
        </div>

        {isNewlyCreated && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-4 rounded-lg mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900">Приют создан и отправлен на модерацию!</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Теперь загрузите логотип и фотографии приюта. Это поможет привлечь больше внимания к вашему приюту.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Logo & Images */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Изображения</h2>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Логотип</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {shelter.logoUrl ? (
                  <Image
                    src={shelter.logoUrl}
                    alt="Логотип"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized={shelter.logoUrl.includes('localhost')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span>Загрузить логотип</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Галерея</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {shelter.images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                  <Image
                    src={img.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={img.imageUrl.includes('localhost')}
                  />
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs text-gray-500 mt-1">Добавить</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название приюта *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Краткое описание
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  maxLength={500}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Полное описание *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Город *
                  </label>
                  <select
                    name="cityId"
                    value={formData.cityId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Выберите город</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}{city.region ? `, ${city.region}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Год основания
                </label>
                <input
                  type="number"
                  name="foundedYear"
                  value={formData.foundedYear || ''}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Контакты</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительный телефон</label>
                <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сайт</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ВКонтакте</label>
                <input type="url" name="vkUrl" value={formData.vkUrl} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                <input type="url" name="telegramUrl" value={formData.telegramUrl} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input type="url" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Часы работы</label>
                <input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Статистика</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Собак</label>
                <input type="number" name="dogsCount" value={formData.dogsCount} onChange={handleChange} min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кошек</label>
                <input type="number" name="catsCount" value={formData.catsCount} onChange={handleChange} min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Других</label>
                <input type="number" name="otherAnimalsCount" value={formData.otherAnimalsCount} onChange={handleChange} min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Волонтёров</label>
                <input type="number" name="volunteersCount" value={formData.volunteersCount || ''} onChange={handleChange} min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center">
                <input type="checkbox" name="acceptsVolunteers" checked={formData.acceptsVolunteers} onChange={handleCheckboxChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="ml-2 text-gray-700">Приют принимает волонтёров</span>
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Нужды приюта</label>
              <textarea name="needs" value={formData.needs} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Donations */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Реквизиты для пожертвований</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
                <input type="text" name="donationCardNumber" value={formData.donationCardNumber} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Держатель карты</label>
                <input type="text" name="donationCardHolder" value={formData.donationCardHolder} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон для перевода</label>
                <input type="tel" name="donationPhone" value={formData.donationPhone} onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Дополнительные реквизиты</label>
              <textarea name="donationDetails" value={formData.donationDetails} onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <Link
              href="/shelters/my"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
