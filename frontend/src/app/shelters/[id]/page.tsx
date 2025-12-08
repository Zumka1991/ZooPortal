import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { sheltersApi } from '@/lib/shelters-api';
import ShelterGallery from '@/components/ShelterGallery';

interface Props {
  params: Promise<{ id: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const shelter = await sheltersApi.getShelter(id);

    return {
      title: `${shelter.name} - Приют для животных | DomZverei`,
      description: shelter.shortDescription || shelter.description.substring(0, 160),
      openGraph: {
        title: shelter.name,
        description: shelter.shortDescription || shelter.description.substring(0, 160),
        url: `${BASE_URL}/shelters/${id}`,
        type: 'website',
        images: shelter.logoUrl ? [shelter.logoUrl] : shelter.images.map(i => i.imageUrl),
        locale: 'ru_RU',
      },
      alternates: {
        canonical: `${BASE_URL}/shelters/${id}`,
      },
    };
  } catch (error) {
    // Only return 404 title for NOT_FOUND, otherwise generic error
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return {
        title: 'Приют не найден | DomZverei',
      };
    }
    return {
      title: 'Ошибка загрузки | DomZverei',
    };
  }
}

export default async function ShelterDetailPage({ params }: Props) {
  const { id } = await params;

  let shelter;
  try {
    shelter = await sheltersApi.getShelter(id);
  } catch (error) {
    // Only show 404 for NOT_FOUND error, throw other errors
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const allImages = shelter.logoUrl
    ? [{ id: 'logo', imageUrl: shelter.logoUrl, isMain: false, sortOrder: -1 }, ...shelter.images]
    : shelter.images;

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AnimalShelter',
    name: shelter.name,
    description: shelter.description,
    image: shelter.logoUrl || shelter.images[0]?.imageUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shelter.address,
      addressLocality: shelter.city.name,
      addressRegion: shelter.city.region,
      addressCountry: 'RU',
    },
    geo: shelter.latitude && shelter.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: shelter.latitude,
      longitude: shelter.longitude,
    } : undefined,
    telephone: shelter.phone,
    email: shelter.email,
    url: shelter.website,
    openingHours: shelter.workingHours,
    foundingDate: shelter.foundedYear ? `${shelter.foundedYear}-01-01` : undefined,
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/shelters" className="inline-flex items-center text-blue-100 hover:text-white mb-4">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад к каталогу
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-4xl font-bold">{shelter.name}</h1>
              {shelter.isVerified && (
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Проверенный приют
                </span>
              )}
            </div>
            <p className="text-blue-100 mt-2">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {shelter.city.name}{shelter.city.region ? `, ${shelter.city.region}` : ''} • {shelter.address}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Gallery */}
              {allImages.length > 0 && (
                <ShelterGallery images={allImages} shelterName={shelter.name} />
              )}

              {/* Description */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">О приюте</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{shelter.description}</p>
                </div>
                {shelter.foundedYear && (
                  <p className="text-gray-500 mt-4">
                    Основан в {shelter.foundedYear} году
                  </p>
                )}
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Статистика</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{shelter.dogsCount}</div>
                    <div className="text-sm text-gray-600 mt-1">Собак</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{shelter.catsCount}</div>
                    <div className="text-sm text-gray-600 mt-1">Кошек</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{shelter.otherAnimalsCount}</div>
                    <div className="text-sm text-gray-600 mt-1">Других</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{shelter.volunteersCount || 0}</div>
                    <div className="text-sm text-gray-600 mt-1">Волонтёров</div>
                  </div>
                </div>
              </div>

              {/* Needs */}
              {shelter.needs && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Чем можно помочь</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{shelter.needs}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Контакты</h2>
                <div className="space-y-4">
                  {shelter.phone && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Телефон</p>
                      <a href={`tel:${shelter.phone}`} className="text-blue-600 hover:underline">
                        {shelter.phone}
                      </a>
                    </div>
                  )}
                  {shelter.phone2 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Телефон 2</p>
                      <a href={`tel:${shelter.phone2}`} className="text-blue-600 hover:underline">
                        {shelter.phone2}
                      </a>
                    </div>
                  )}
                  {shelter.email && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <a href={`mailto:${shelter.email}`} className="text-blue-600 hover:underline break-all">
                        {shelter.email}
                      </a>
                    </div>
                  )}
                  {shelter.website && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Сайт</p>
                      <a
                        href={shelter.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {shelter.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(shelter.vkUrl || shelter.telegramUrl || shelter.instagramUrl) && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-500 mb-3">Соцсети</p>
                    <div className="flex gap-3">
                      {shelter.vkUrl && (
                        <a
                          href={shelter.vkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.39 14.53h-1.34c-.71 0-.93-.57-2.2-1.84-1.11-1.08-1.6-1.23-1.88-1.23-.39 0-.5.11-.5.64v1.68c0 .45-.14.72-1.34.72-2.21 0-4.66-1.34-6.38-3.84-2.58-3.69-3.28-6.46-3.28-7.03 0-.28.11-.54.64-.54h1.34c.48 0 .66.22.84.73.98 2.82 2.62 5.29 3.3 5.29.26 0 .37-.12.37-.76v-2.99c-.09-1.39-.81-1.51-.81-2 0-.23.19-.45.5-.45h2.1c.4 0 .55.22.55.69v3.71c0 .4.18.55.29.55.26 0 .47-.15.94-.62 1.43-1.61 2.46-4.1 2.46-4.1.13-.29.36-.54.84-.54h1.34c.51 0 .62.26.51.69-.18.99-2.32 4.4-2.32 4.4-.22.37-.3.53 0 .93.22.3.94.92 1.42 1.48.86.99 1.52 1.82 1.7 2.4.17.57-.1.86-.67.86z" />
                          </svg>
                        </a>
                      )}
                      {shelter.telegramUrl && (
                        <a
                          href={shelter.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.04-.75 4.08-1.78 6.8-2.95 8.15-3.53 3.88-1.62 4.69-1.9 5.21-1.91.12 0 .38.03.55.17.14.11.18.27.2.38.01.08.03.33.01.51z" />
                          </svg>
                        </a>
                      )}
                      {shelter.instagramUrl && (
                        <a
                          href={shelter.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Working hours */}
                {shelter.workingHours && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">Часы работы</p>
                    <p className="text-gray-700">{shelter.workingHours}</p>
                  </div>
                )}

                {/* Volunteers */}
                {shelter.acceptsVolunteers && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-green-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Принимает волонтёров
                    </div>
                  </div>
                )}
              </div>

              {/* Donations */}
              {(shelter.donationCardNumber || shelter.donationPhone || shelter.donationDetails) && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Помочь приюту</h2>
                  <div className="space-y-4">
                    {shelter.donationCardNumber && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Номер карты</p>
                        <p className="font-mono text-lg text-gray-900">{shelter.donationCardNumber}</p>
                        {shelter.donationCardHolder && (
                          <p className="text-sm text-gray-600">{shelter.donationCardHolder}</p>
                        )}
                      </div>
                    )}
                    {shelter.donationPhone && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Телефон для перевода</p>
                        <p className="font-mono text-lg text-gray-900">{shelter.donationPhone}</p>
                      </div>
                    )}
                    {shelter.donationDetails && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Дополнительно</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{shelter.donationDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
