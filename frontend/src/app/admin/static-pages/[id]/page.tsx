'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi, StaticPage, UpdateStaticPageRequest } from '@/lib/admin-api';

export default function EditStaticPagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<StaticPage | null>(null);
  const [formData, setFormData] = useState<UpdateStaticPageRequest>({
    title: '',
    content: '',
    metaDescription: '',
    isPublished: true,
  });

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const data = await adminApi.staticPages.getById(id);
      setPage(data);
      setFormData({
        title: data.title,
        content: data.content,
        metaDescription: data.metaDescription || '',
        isPublished: data.isPublished,
      });
    } catch (error) {
      console.error('Failed to load page:', error);
      alert('Ошибка загрузки страницы');
      router.push('/admin/static-pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await adminApi.staticPages.update(id, formData);
      alert('Страница обновлена');
      router.push('/admin/static-pages');
    } catch (error: any) {
      alert(error.message || 'Ошибка обновления страницы');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Редактировать страницу</h1>
          <p className="text-gray-500 mt-1">
            Slug: <code className="bg-gray-100 px-2 py-1 rounded">{page.slug}</code>
          </p>
        </div>
        <Link
          href="/admin/static-pages"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Назад к списку
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="О проекте"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta-описание
          </label>
          <input
            type="text"
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            placeholder="Краткое описание для поисковых систем"
            maxLength={500}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Используется для SEO (до 500 символов)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Содержимое (Markdown) *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={15}
            placeholder="# Заголовок&#10;&#10;Текст страницы в формате Markdown..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">
            Поддерживается форматирование Markdown (заголовки, списки, ссылки и т.д.)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
            Опубликовано
          </label>
        </div>

        {page.lastEditedBy && (
          <div className="text-sm text-gray-500">
            Последнее изменение: {page.lastEditedBy.name} •{' '}
            {new Date(page.updatedAt || page.createdAt).toLocaleDateString('ru-RU')}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <Link
            href="/admin/static-pages"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
