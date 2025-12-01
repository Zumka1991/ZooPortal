'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  adminApi,
  Article,
  UpdateArticleRequest,
  ARTICLE_CATEGORIES,
  ANIMAL_TYPES,
  ArticleCategory,
  AnimalType,
} from '@/lib/admin-api';
import ImageUpload from '@/components/admin/ImageUpload';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState<Article | null>(null);

  const [formData, setFormData] = useState<UpdateArticleRequest>({
    title: '',
    content: '',
    summary: '',
    imageUrl: '',
    category: 'Care',
    animalType: undefined,
    isPublished: false,
  });

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const data = await adminApi.getArticle(id);
        setArticle(data);
        setFormData({
          title: data.title,
          content: data.content,
          summary: data.summary || '',
          imageUrl: data.imageUrl || '',
          category: data.category as ArticleCategory,
          animalType: data.animalType as AnimalType | undefined,
          isPublished: data.isPublished,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setIsLoading(false);
      }
    };
    loadArticle();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      await adminApi.updateArticle(id, formData);
      router.push('/admin/articles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Статья не найдена</h1>
        <Link href="/admin/articles" className="text-green-600 hover:underline">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Редактирование статьи</h1>
        <Link
          href="/admin/articles"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Назад к списку
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="font-medium">Slug:</span> {article.slug}
          </div>
          <div>
            <span className="font-medium">Просмотры:</span> {article.viewCount}
          </div>
          <div>
            <span className="font-medium">Создана:</span>{' '}
            {new Date(article.createdAt).toLocaleDateString('ru-RU')}
          </div>
        </div>
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
            maxLength={200}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Краткое описание
          </label>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            maxLength={500}
            rows={2}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ArticleCategory })
              }
              required
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {ARTICLE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип животного
            </label>
            <select
              value={formData.animalType || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  animalType: e.target.value ? (e.target.value as AnimalType) : undefined,
                })
              }
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Не указано</option>
              {ANIMAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Изображение
          </label>
          <ImageUpload
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Содержимое статьи *
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={15}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Поддерживается Markdown для форматирования
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
            Опубликовано
          </label>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Link
            href="/admin/articles"
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}
