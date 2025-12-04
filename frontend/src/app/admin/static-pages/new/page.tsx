'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi, CreateStaticPageRequest } from '@/lib/admin-api';

export default function NewStaticPagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStaticPageRequest>({
    slug: '',
    title: '',
    content: '',
    metaDescription: '',
    isPublished: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация slug
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      alert('Slug может содержать только строчные латинские буквы, цифры и дефисы');
      return;
    }

    try {
      setLoading(true);
      await adminApi.staticPages.create(formData);
      alert('Страница создана');
      router.push('/admin/static-pages');
    } catch (error: any) {
      alert(error.message || 'Ошибка создания страницы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Создать статическую страницу</h1>
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
            Slug *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
            required
            pattern="[a-z0-9-]+"
            placeholder="about, contacts, privacy-policy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Только строчные латинские буквы, цифры и дефисы. Используется в URL.
          </p>
        </div>

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
            Опубликовать сразу
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать страницу'}
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
