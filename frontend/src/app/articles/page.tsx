import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { articlesApi, CATEGORY_LABELS, ANIMAL_TYPE_LABELS } from '@/lib/articles-api';
import { ArticlesFilters } from '@/components/ArticlesFilters';

export const metadata: Metadata = {
  title: 'Статьи о животных | DomZverei',
  description: 'Полезные статьи по уходу за животными, воспитанию, питанию и здоровью. Советы от экспертов для владельцев домашних питомцев.',
  openGraph: {
    title: 'Статьи о животных | DomZverei',
    description: 'Полезные статьи по уходу за животными, воспитанию, питанию и здоровью.',
  },
};

interface Props {
  searchParams: Promise<{
    page?: string;
    category?: string;
    animalType?: string;
    search?: string;
  }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category || '';
  const animalType = params.animalType || '';
  const search = params.search || '';

  let articles;
  let error = '';

  try {
    articles = await articlesApi.getArticles({
      page,
      pageSize: 9,
      category: category || undefined,
      animalType: animalType || undefined,
      search: search || undefined,
    });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Ошибка загрузки';
    articles = { items: [], totalCount: 0, pageNumber: 1, pageSize: 9, totalPages: 0 };
  }

  const { items, totalCount, totalPages } = articles;

  // Build pagination URLs
  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set('page', newPage.toString());
    if (category) params.set('category', category);
    if (animalType) params.set('animalType', animalType);
    if (search) params.set('search', search);
    const query = params.toString();
    return `/articles${query ? `?${query}` : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Статьи</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Полезные материалы по уходу за животными, воспитанию, питанию и здоровью
        </p>
      </div>

      {/* Filters - Client Component for interactivity */}
      <ArticlesFilters
        currentCategory={category}
        currentAnimalType={animalType}
        currentSearch={search}
      />

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-8">
          {error}
        </div>
      )}

      {/* Results count */}
      <p className="text-gray-600 mb-6">
        Найдено статей: {totalCount}
      </p>

      {/* Articles Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Статьи не найдены</p>
          <p className="text-gray-400 mt-2">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-video bg-gray-200 relative overflow-hidden">
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={article.imageUrl.includes('localhost')}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    {CATEGORY_LABELS[article.category] || article.category}
                  </span>
                  {article.animalType && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {ANIMAL_TYPE_LABELS[article.animalType] || article.animalType}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{article.author.name}</span>
                  <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination - SSR-friendly with links */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              ← Назад
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed">
              ← Назад
            </span>
          )}
          <span className="px-4 py-2 text-gray-600">
            Страница {page} из {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildUrl(page + 1)}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Далее →
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded-md opacity-50 cursor-not-allowed">
              Далее →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
