'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/AuthProvider';
import {
  lostFoundApi,
  LostFoundDetail,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  LOST_FOUND_STATUS_LABELS,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/lost-found-api';
import { messagesApi } from '@/lib/messages-api';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />,
});

export default function LostFoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [item, setItem] = useState<LostFoundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const isOwner = user && item && user.id === item.user.id;

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    setIsLoading(true);
    try {
      const data = await lostFoundApi.getById(id);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!item || !confirm('Отметить как найден/возвращён?')) return;

    try {
      await lostFoundApi.resolve(id);
      loadItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('Удалить объявление? Это действие нельзя отменить.')) return;

    try {
      await lostFoundApi.delete(id);
      router.push('/lost-found/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;

    setUploadingImage(true);
    try {
      await lostFoundApi.uploadImage(id, file);
      loadItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async (imageId: string) => {
    if (!confirm('Удалить фото?')) return;

    try {
      await lostFoundApi.deleteImage(id, imageId);
      loadItem();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!item) return;

    setIsStartingChat(true);
    try {
      const conversation = await messagesApi.startConversation({
        userId: item.user.id,
        lostFoundId: id,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error || 'Объявление не найдено'}
        </div>
        <Link href="/lost-found" className="mt-4 inline-block text-green-600 hover:underline">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'Lost';
  const hasLocation = item.latitude && item.longitude;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/lost-found" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад к списку
      </Link>

      {/* Moderation status banner for owner */}
      {isOwner && item.moderationStatus !== 'Approved' && (
        <div className={`mb-6 p-4 rounded-lg ${
          item.moderationStatus === 'Pending'
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              item.moderationStatus === 'Pending' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              {item.moderationStatus === 'Pending' ? (
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`font-medium ${
                item.moderationStatus === 'Pending' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {MODERATION_STATUS_LABELS[item.moderationStatus]}
              </h3>
              <p className={`text-sm mt-1 ${
                item.moderationStatus === 'Pending' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {item.moderationStatus === 'Pending'
                  ? 'Ваше объявление проходит проверку модератором. Оно станет видимым для всех после одобрения.'
                  : item.moderationComment || 'Объявление было отклонено модератором.'
                }
              </p>
              {item.moderationStatus === 'Rejected' && (
                <Link
                  href={`/lost-found/${item.id}/edit`}
                  className="inline-block mt-2 text-sm text-red-700 underline hover:text-red-800"
                >
                  Редактировать и отправить повторно
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Images */}
        <div className="relative">
          {item.images.length > 0 ? (
            <div>
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={item.images[selectedImage].url}
                  alt={item.title}
                  fill
                  className="object-contain"
                  unoptimized={item.images[selectedImage].url.includes('localhost')}
                />
              </div>
              {item.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {item.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden ${
                        idx === selectedImage ? 'ring-2 ring-green-500' : ''
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={img.url.includes('localhost')}
                      />
                      {isOwner && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleImageDelete(img.id); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Upload button for owner */}
          {isOwner && item.images.length < 5 && (
            <div className="absolute bottom-4 right-4">
              <label className="bg-white px-4 py-2 rounded-lg shadow cursor-pointer hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                {uploadingImage ? 'Загрузка...' : '+ Добавить фото'}
              </label>
            </div>
          )}

          {/* Type badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
            isLost ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {LOST_FOUND_TYPE_LABELS[item.type]}
          </div>

          {/* Status badge */}
          {item.status !== 'Active' && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-white">
              {LOST_FOUND_STATUS_LABELS[item.status]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h1>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Животное</div>
              <div className="font-medium">{ANIMAL_TYPE_LABELS[item.animalType]}</div>
            </div>
            {item.breed && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Порода</div>
                <div className="font-medium">{item.breed}</div>
              </div>
            )}
            {item.color && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Окрас</div>
                <div className="font-medium">{item.color}</div>
              </div>
            )}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500">Дата</div>
              <div className="font-medium">
                {new Date(item.eventDate).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Distinctive features */}
          {item.distinctiveFeatures && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Особые приметы</h2>
              <p className="text-gray-700">{item.distinctiveFeatures}</p>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
            <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
          </div>

          {/* Location */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Место</h2>
            <div className="flex items-center gap-2 text-gray-700 mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{item.city.name}{item.city.region ? `, ${item.city.region}` : ''}</span>
              {item.address && <span className="text-gray-500">- {item.address}</span>}
            </div>

            {hasLocation && (
              <Map
                center={[item.latitude!, item.longitude!]}
                zoom={15}
                height="300px"
                markers={[{
                  id: item.id,
                  lat: item.latitude!,
                  lng: item.longitude!,
                  title: item.title,
                  type: isLost ? 'lost' : 'found',
                }]}
                className="rounded-lg overflow-hidden"
              />
            )}
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Контакт</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-medium">
                    {item.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{item.user.name}</span>
              </div>

              {item.contactPhone && (
                showPhone ? (
                  <a
                    href={`tel:${item.contactPhone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {item.contactPhone}
                  </a>
                ) : (
                  <button
                    onClick={() => setShowPhone(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Показать телефон
                  </button>
                )
              )}

              {!isOwner && (
                <button
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {isStartingChat ? 'Загрузка...' : 'Написать'}
                </button>
              )}
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="border-t pt-6 flex flex-wrap gap-3">
              {item.status === 'Active' && (
                <button
                  onClick={handleResolve}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Отметить как найден / возвращён
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
              >
                Удалить объявление
              </button>
            </div>
          )}

          {/* Meta */}
          <div className="border-t pt-4 mt-6 text-sm text-gray-500">
            Опубликовано: {new Date(item.createdAt).toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>
    </div>
  );
}
