import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api-url';
import {
  LostFoundDetail,
  LOST_FOUND_TYPE_LABELS,
  ANIMAL_TYPE_LABELS,
  LOST_FOUND_STATUS_LABELS,
} from '@/lib/lost-found-api';
import LostFoundGallery from '@/components/LostFoundGallery';
import LostFoundActions from '@/components/LostFoundActions';
import LostFoundMap from '@/components/LostFoundMap';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

interface Props {
  params: Promise<{ id: string }>;
}

async function getLostFound(id: string): Promise<LostFoundDetail | null> {
  try {
    const response = await fetch(`${getApiUrl()}/lost-found/${id}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getLostFound(id);

  if (!item) {
    return { title: 'Объявление не найдено | DomZverei' };
  }

  const typeLabel = LOST_FOUND_TYPE_LABELS[item.type];
  const animalLabel = ANIMAL_TYPE_LABELS[item.animalType];
  const description = item.description.substring(0, 160);

  return {
    title: `${item.title} - ${typeLabel} ${animalLabel} | DomZverei`,
    description,
    openGraph: {
      title: item.title,
      description,
      url: `${BASE_URL}/lost-found/${id}`,
      type: 'website',
      images: item.images.length > 0 ? [item.images[0].url] : [],
      locale: 'ru_RU',
    },
    alternates: {
      canonical: `${BASE_URL}/lost-found/${id}`,
    },
  };
}

export default async function LostFoundDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getLostFound(id);

  if (!item) {
    notFound();
  }

  const isLost = item.type === 'Lost';
  const hasLocation = item.latitude && item.longitude;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isLost ? 'LostAction' : 'FindAction',
    name: item.title,
    description: item.description,
    image: item.images[0]?.url,
    object: {
      '@type': 'Thing',
      name: `${ANIMAL_TYPE_LABELS[item.animalType]}${item.breed ? ` (${item.breed})` : ''}`,
      description: item.distinctiveFeatures,
    },
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: item.city.name,
        addressRegion: item.city.region,
        addressCountry: 'RU',
      },
      ...(hasLocation ? {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: item.latitude,
          longitude: item.longitude,
        },
      } : {}),
    },
    startTime: item.eventDate,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/lost-found" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к списку
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Images */}
          <div className="relative">
            <LostFoundGallery images={item.images} title={item.title} />

            {/* Type badge */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium ${
              isLost ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {LOST_FOUND_TYPE_LABELS[item.type]}
            </div>

            {/* Status badge */}
            {item.status !== 'Active' && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-white">
                {LOST_FOUND_STATUS_LABELS[item.status]}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h1>

            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Животное</div>
                <div className="font-medium">{ANIMAL_TYPE_LABELS[item.animalType]}</div>
              </div>
              {item.breed && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Порода</div>
                  <div className="font-medium">{item.breed}</div>
                </div>
              )}
              {item.color && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Окрас</div>
                  <div className="font-medium">{item.color}</div>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Дата</div>
                <div className="font-medium">
                  {new Date(item.eventDate).toLocaleDateString('ru-RU')}
                </div>
              </div>
            </div>

            {/* Distinctive features */}
            {item.distinctiveFeatures && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Особые приметы</h2>
                <p className="text-gray-700">{item.distinctiveFeatures}</p>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
              <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
            </div>

            {/* Location */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Место</h2>
              <div className="flex items-center gap-2 text-gray-700 mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{item.city.name}{item.city.region ? `, ${item.city.region}` : ''}</span>
                {item.address && <span className="text-gray-500">- {item.address}</span>}
              </div>

              {hasLocation && (
                <LostFoundMap
                  latitude={item.latitude!}
                  longitude={item.longitude!}
                  title={item.title}
                  id={item.id}
                  isLost={isLost}
                />
              )}
            </div>

            {/* Contact */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Контакт</h2>
              <LostFoundActions
                itemId={id}
                userId={item.user.id}
                userName={item.user.name}
                contactPhone={item.contactPhone}
              />
            </div>

            {/* Meta */}
            <div className="border-t pt-4 mt-6 text-sm text-gray-500">
              Опубликовано: {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
