import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { staticPagesApi } from '@/lib/static-pages-api';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await staticPagesApi.getBySlug('about');
    return {
      title: page.title,
      description: page.metaDescription || page.title
    };
  } catch (error) {
    return {
      title: 'О проекте',
      description: 'Информация о портале DomZverei'
    };
  }
}

export default async function AboutPage() {
  const page = await staticPagesApi.getBySlug('about');

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">{page.title}</h1>
          <div className="markdown-content max-w-none">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
}
