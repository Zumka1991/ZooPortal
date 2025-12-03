import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { articlesApi, CATEGORY_LABELS, ANIMAL_TYPE_LABELS } from '@/lib/articles-api';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await articlesApi.getArticleBySlug(slug);
    return {
      title: `${article.title} | DomZverei`,
      description: article.summary || article.content.substring(0, 160),
      openGraph: {
        title: article.title,
        description: article.summary || article.content.substring(0, 160),
        images: article.imageUrl ? [article.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Статья не найдена | DomZverei',
    };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let article;

  try {
    article = await articlesApi.getArticleBySlug(slug);
  } catch {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Simple markdown-like rendering (basic)
  const renderContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        // Headers
        if (paragraph.startsWith('# ')) {
          return (
            <h1 key={index} className="text-3xl font-bold mt-8 mb-4">
              {paragraph.slice(2)}
            </h1>
          );
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h2 key={index} className="text-2xl font-bold mt-6 mb-3">
              {paragraph.slice(3)}
            </h2>
          );
        }
        if (paragraph.startsWith('### ')) {
          return (
            <h3 key={index} className="text-xl font-bold mt-4 mb-2">
              {paragraph.slice(4)}
            </h3>
          );
        }
        // List items
        if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
          const items = paragraph.split('\n').filter((line) => line.trim());
          return (
            <ul key={index} className="list-disc pl-6 my-4 space-y-2">
              {items.map((item, i) => (
                <li key={i}>{item.slice(2)}</li>
              ))}
            </ul>
          );
        }
        // Regular paragraph
        return (
          <p key={index} className="my-4 leading-relaxed">
            {paragraph}
          </p>
        );
      });
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-green-600">
              Главная
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/articles" className="hover:text-green-600">
              Статьи
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 truncate max-w-xs">{article.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
          {article.animalType && (
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
              {ANIMAL_TYPE_LABELS[article.animalType] || article.animalType}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">{article.title}</h1>

        <div className="flex items-center justify-between text-gray-500 pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
              {article.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-gray-900 font-medium">{article.author.name}</p>
              <p className="text-sm">
                {formatDate(article.publishedAt || article.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-sm">
            {article.viewCount} просмотров
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.imageUrl && (
        <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
            unoptimized={article.imageUrl.includes('localhost')}
          />
        </div>
      )}

      {/* Summary */}
      {article.summary && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-lg text-gray-700 italic">
          {article.summary}
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none text-gray-800">
        {renderContent(article.content)}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t">
        <div className="flex items-center justify-between">
          <Link
            href="/articles"
            className="text-green-600 hover:text-green-700 flex items-center gap-2"
          >
            ← Все статьи
          </Link>
          <div className="flex gap-4">
            <span className="text-gray-500">Поделиться:</span>
            <button className="text-gray-600 hover:text-blue-600">VK</button>
            <button className="text-gray-600 hover:text-blue-500">Telegram</button>
          </div>
        </div>
      </footer>
    </article>
  );
}
