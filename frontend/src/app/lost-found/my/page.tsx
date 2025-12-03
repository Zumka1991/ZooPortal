'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import {
  lostFoundApi,
  MyLostFoundItem,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  LOST_FOUND_STATUS_LABELS,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/lost-found-api';

export default function MyLostFoundPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<MyLostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
    }
  }, [isAuthenticated]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await lostFoundApi.getMy();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Мои потеряшки</h1>
        <Link
          href="/lost-found/new"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-lg mb-4">У вас пока нет объявлений</p>
          <Link
            href="/lost-found/new"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Создать первое объявление
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/lost-found/${item.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4 p-4">
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {item.mainImageUrl ? (
                    <Image
                      src={item.mainImageUrl}
                      alt={item.title}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized={item.mainImageUrl.includes('localhost')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.type === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {LOST_FOUND_TYPE_LABELS[item.type]}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[item.moderationStatus]}`}>
                        {MODERATION_STATUS_LABELS[item.moderationStatus]}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {ANIMAL_TYPE_LABELS[item.animalType]} - {item.city.name}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.eventDate).toLocaleDateString('ru-RU')}
                  </p>

                  {item.status !== 'Active' && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {LOST_FOUND_STATUS_LABELS[item.status]}
                    </span>
                  )}

                  {item.moderationComment && (
                    <p className="text-sm text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                      {item.moderationComment}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
