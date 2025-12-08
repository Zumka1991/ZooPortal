import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getApiUrl } from '@/lib/api-url';
import {
  ListingDetail,
  ANIMAL_TYPE_LABELS,
  ANIMAL_TYPE_ICONS,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_COLORS,
  GENDER_LABELS,
  formatAge,
  formatPrice,
} from '@/lib/listings-api';
import ListingGallery from '@/components/ListingGallery';
import ListingActions from '@/components/ListingActions';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

interface Props {
  params: Promise<{ id: string }>;
}

async function getListing(id: string): Promise<ListingDetail | null> {
  try {
    const response = await fetch(`${getApiUrl()}/listings/${id}`, {
      next: { revalidate: 60 },
      cache: 'no-store', // Avoid caching failed requests
    });

    // Only return null for 404 - other errors should be thrown
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`Failed to fetch listing ${id}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load listing: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Network errors or JSON parse errors
    console.error(`Error fetching listing ${id}:`, error);
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const listing = await getListing(id);

    if (!listing) {
      return { title: 'Объявление не найдено | DomZverei' };
    }

    const animalLabel = ANIMAL_TYPE_LABELS[listing.animalType] || 'Животное';
    const typeLabel = LISTING_TYPE_LABELS[listing.type] || '';
    const description = listing.description.substring(0, 160);

    return {
      title: `${listing.title} - ${typeLabel} ${animalLabel} | DomZverei`,
      description,
      openGraph: {
        title: listing.title,
        description,
        url: `${BASE_URL}/listings/${id}`,
        type: 'website',
        images: listing.images.length > 0 ? [listing.images[0].url] : [],
        locale: 'ru_RU',
      },
      alternates: {
        canonical: `${BASE_URL}/listings/${id}`,
      },
    };
  } catch (error) {
    return { title: 'Ошибка загрузки | DomZverei' };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.images[0]?.url,
    category: ANIMAL_TYPE_LABELS[listing.animalType],
    brand: listing.shelter ? {
      '@type': 'Organization',
      name: listing.shelter.name,
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: listing.price || 0,
      priceCurrency: 'RUB',
      availability: listing.status === 'Active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': listing.shelter ? 'Organization' : 'Person',
        name: listing.shelter?.name || listing.owner.name,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад к объявлениям
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${LISTING_TYPE_COLORS[listing.type]}`}>
                    {LISTING_TYPE_LABELS[listing.type]}
                  </span>
                  {listing.shelter?.isVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Из приюта
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold">{listing.title}</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gallery */}
              <ListingGallery
                images={listing.images}
                title={listing.title}
                fallbackIcon={ANIMAL_TYPE_ICONS[listing.animalType]}
              />

              {/* Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">О животном</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Вид</div>
                    <div className="font-medium">{ANIMAL_TYPE_LABELS[listing.animalType]}</div>
                  </div>
                  {listing.breed && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Порода</div>
                      <div className="font-medium">{listing.breed}</div>
                    </div>
                  )}
                  {listing.age && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Возраст</div>
                      <div className="font-medium">{formatAge(listing.age)}</div>
                    </div>
                  )}
                  {listing.gender && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-500">Пол</div>
                      <div className={`font-medium ${listing.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}`}>
                        {GENDER_LABELS[listing.gender]}
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold mb-2">Описание</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price & Actions */}
              <ListingActions
                listingId={id}
                ownerId={listing.owner.id}
                initialIsFavorite={listing.isFavorite}
                initialIsLiked={listing.isLiked}
                initialLikesCount={listing.likesCount}
                price={formatPrice(listing.price, listing.type)}
              />

              {/* Location */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-3">Местоположение</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{listing.city.name}{listing.city.region ? `, ${listing.city.region}` : ''}</span>
                </div>
              </div>

              {/* Owner/Shelter Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {listing.shelter ? (
                  <>
                    <h3 className="font-semibold mb-3">Приют</h3>
                    <Link
                      href={`/shelters/${listing.shelter.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                    >
                      {listing.shelter.logoUrl ? (
                        <Image
                          src={listing.shelter.logoUrl}
                          alt={listing.shelter.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                          unoptimized={listing.shelter.logoUrl.includes('localhost')}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {listing.shelter.name}
                          {listing.shelter.isVerified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">Перейти на страницу приюта</div>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-3">Владелец</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="font-medium">{listing.owner.name}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Meta Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-gray-500">
                <div className="flex justify-between mb-2">
                  <span>Опубликовано:</span>
                  <span>{new Date(listing.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Действует до:</span>
                  <span>{new Date(listing.expiresAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
