'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  lostFoundApi,
  LostFoundDetail,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  LOST_FOUND_STATUS_LABELS,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/lost-found-api';
import LostFoundGallery from '@/components/LostFoundGallery';
import LostFoundActions from '@/components/LostFoundActions';
import LostFoundMap from '@/components/LostFoundMap';
import { useAuth } from '@/components/AuthProvider';

export default function LostFoundDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [item, setItem] = useState<LostFoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await lostFoundApi.getById(id);
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/lost-found" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к списку
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error || 'Объявление не найдено'}
        </div>
      </div>
    );
  }

  const isLost = item.type === 'Lost';
  const hasLocation = item.latitude && item.longitude;
  const isOwner = user?.id === item.user.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/lost-found" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад к списку
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Images */}
        <div className="relative">
          <LostFoundGallery images={item.images} title={item.title} />

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

        {/* Moderation status (for owner) */}
        {isOwner && item.moderationStatus !== 'Approved' && (
          <div className={`p-4 ${MODERATION_STATUS_COLORS[item.moderationStatus]}`}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                Статус модерации: {MODERATION_STATUS_LABELS[item.moderationStatus]}
              </span>
            </div>
            {item.moderationComment && (
              <p className="mt-2 text-sm">
                Комментарий модератора: {item.moderationComment}
              </p>
            )}
          </div>
        )}

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
              <LostFoundMap
                latitude={item.latitude!}
                longitude={item.longitude!}
                title={item.title}
                id={item.id}
                isLost={isLost}
              />
            )}
          </div>

          {/* Contact */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Контакт</h2>
            <LostFoundActions
              itemId={id}
              userId={item.user.id}
              userName={item.user.name}
              contactPhone={item.contactPhone}
            />
          </div>

          {/* Meta */}
          <div className="border-t pt-4 mt-6 text-sm text-gray-500">
            Опубликовано: {new Date(item.createdAt).toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>
    </div>
  );
}
