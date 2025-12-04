'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminStatsApi, AdminStats } from '@/lib/admin-stats-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStatsApi.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { name: 'Всего статей', value: stats?.articlesCount ?? '—', href: '/admin/articles' },
    { name: 'Галерея', value: stats?.galleryCount ?? '—', href: '/admin/gallery' },
    { name: 'Объявления', value: stats?.listingsCount ?? '—', href: '/admin/listings' },
    { name: 'Потеряшки', value: stats?.lostFoundCount ?? '—', href: '/admin/lost-found' },
    { name: 'Приютов', value: stats?.sheltersCount ?? '—', href: '/admin/shelters' },
    { name: 'Города', value: stats?.citiesCount ?? '—', href: '/admin/cities' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500">{stat.name}</p>
            {loading ? (
              <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
          <div className="space-y-2">
            <Link
              href="/admin/articles/new"
              className="block px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              ➕ Создать новую статью
            </Link>
            <Link
              href="/admin/shelters/new"
              className="block px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              ➕ Добавить приют
            </Link>
            <Link
              href="/admin/gallery"
              className="block px-4 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
            >
              🖼️ Модерация галереи
            </Link>
            <Link
              href="/admin/shelters"
              className="block px-4 py-2 bg-cyan-50 text-cyan-700 rounded hover:bg-cyan-100 transition-colors"
            >
              🏠 Модерация приютов
            </Link>
            <Link
              href="/admin/listings"
              className="block px-4 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
            >
              📋 Модерация объявлений
            </Link>
            <Link
              href="/admin/lost-found"
              className="block px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
            >
              🔍 Модерация потеряшек
            </Link>
            <Link
              href="/admin/cities"
              className="block px-4 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
            >
              🏙️ Управление городами
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Последние действия</h2>
          <p className="text-gray-500 text-sm">История действий появится здесь</p>
        </div>
      </div>
    </div>
  );
}
