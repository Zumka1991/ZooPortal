'use client';

import Link from 'next/link';

const stats = [
  { name: 'Всего статей', value: '—', href: '/admin/articles' },
  { name: 'Галерея', value: '—', href: '/admin/gallery', highlight: true },
  { name: 'Пользователей', value: '—', href: '/admin/users' },
  { name: 'Приютов', value: '—', href: '/admin/shelters' },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500">{stat.name}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
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
