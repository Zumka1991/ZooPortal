'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  sheltersApi,
  ShelterListItem,
  MODERATION_STATUS_LABELS,
  MODERATION_STATUS_COLORS,
} from '@/lib/shelters-api';

export default function MySheltersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [shelters, setShelters] = useState<ShelterListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadShelters = async () => {
      if (!isAuthenticated) return;

      try {
        const data = await sheltersApi.getMyShelters();
        setShelters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadShelters();
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мои приюты</h1>
            <p className="text-gray-600 mt-2">Управляйте информацией о ваших приютах</p>
          </div>
          <Link
            href="/shelters/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить приют
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
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
            <p className="text-gray-500 text-lg mb-4">У вас пока нет приютов</p>
            <Link
              href="/shelters/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Добавить первый приют
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shelters.map((shelter) => (
              <div
                key={shelter.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {shelter.logoUrl ? (
                    <Image
                      src={shelter.logoUrl}
                      alt={shelter.name}
                      fill
                      className="object-cover"
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
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${MODERATION_STATUS_COLORS[shelter.moderationStatus]}`}>
                      {MODERATION_STATUS_LABELS[shelter.moderationStatus]}
                    </span>
                  </div>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {shelter.name}
                  </h2>

                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {shelter.city.name}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="flex items-center text-gray-600">
                      <span className="mr-1">🐕</span>
                      {shelter.dogsCount}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <span className="mr-1">🐈</span>
                      {shelter.catsCount}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      Всего: {shelter.totalAnimals}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      href={`/shelters/${shelter.id}/edit`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Редактировать
                    </Link>
                    {shelter.moderationStatus === 'Approved' && (
                      <Link
                        href={`/shelters/${shelter.id}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Просмотр
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
