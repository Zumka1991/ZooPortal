'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminApi, StaticPageListItem } from '@/lib/admin-api';

export default function AdminStaticPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<StaticPageListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await adminApi.staticPages.getAll();
      setPages(response.items);
    } catch (error) {
      console.error('Failed to load static pages:', error);
      alert('Ошибка загрузки страниц');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Вы уверены, что хотите удалить страницу "${slug}"?`)) return;

    try {
      await adminApi.staticPages.delete(id);
      await loadPages();
      alert('Страница удалена');
    } catch (error: any) {
      alert(error.message || 'Ошибка удаления страницы');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Статические страницы</h1>
        <Link
          href="/admin/static-pages/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Создать страницу
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Страницы не найдены</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заголовок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата обновления
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {page.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        page.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {page.isPublished ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {page.updatedAt
                      ? new Date(page.updatedAt).toLocaleDateString('ru-RU')
                      : new Date(page.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <Link
                      href={`/admin/static-pages/${page.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(page.id, page.slug)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
