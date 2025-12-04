'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { sheltersApi, ShelterDetail } from '@/lib/shelters-api';

export default function ShelterDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [shelter, setShelter] = useState<ShelterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<number>(0);

  useEffect(() => {
    const loadShelter = async () => {
      try {
        const data = await sheltersApi.getShelter(id);
        setShelter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setIsLoading(false);
      }
    };

    loadShelter();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Приют не найден</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/shelters" className="text-blue-600 hover:underline">
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = shelter.images.find(i => i.isMain) || shelter.images[0];
  const allImages = shelter.logoUrl
    ? [{ id: 'logo', imageUrl: shelter.logoUrl, isMain: false, sortOrder: -1 }, ...shelter.images]
    : shelter.images;

  return (
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
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="aspect-video relative bg-gray-100">
                  <Image
                    src={allImages[selectedImage]?.imageUrl || '/placeholder.jpg'}
                    alt={shelter.name}
                    fill
                    className="object-cover"
                    unoptimized={allImages[selectedImage]?.imageUrl.includes('localhost')}
                  />
                </div>
                {allImages.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {allImages.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={img.imageUrl}
                          alt=""
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized={img.imageUrl.includes('localhost')}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                  <div className="text-gray-600">Собак</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{shelter.catsCount}</div>
                  <div className="text-gray-600">Кошек</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{shelter.otherAnimalsCount}</div>
                  <div className="text-gray-600">Других</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">{shelter.totalAnimals}</div>
                  <div className="text-gray-600">Всего</div>
                </div>
              </div>
              {shelter.volunteersCount && (
                <p className="text-gray-600 mt-4">
                  Волонтёров: <span className="font-semibold">{shelter.volunteersCount}</span>
                </p>
              )}
            </div>

            {/* Needs */}
            {shelter.needs && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Нужды приюта</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{shelter.needs}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contacts */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Контакты</h2>
              <div className="space-y-3">
                {shelter.phone && (
                  <a href={`tel:${shelter.phone}`} className="flex items-center text-gray-700 hover:text-blue-600">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {shelter.phone}
                  </a>
                )}
                {shelter.phone2 && (
                  <a href={`tel:${shelter.phone2}`} className="flex items-center text-gray-700 hover:text-blue-600">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {shelter.phone2}
                  </a>
                )}
                {shelter.email && (
                  <a href={`mailto:${shelter.email}`} className="flex items-center text-gray-700 hover:text-blue-600">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {shelter.email}
                  </a>
                )}
                {shelter.website && (
                  <a href={shelter.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-blue-600">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Сайт
                  </a>
                )}
              </div>

              {/* Social links */}
              {(shelter.vkUrl || shelter.telegramUrl || shelter.instagramUrl) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-3">Социальные сети</p>
                  <div className="flex gap-3">
                    {shelter.vkUrl && (
                      <a href={shelter.vkUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.684 4 8.253c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.847 2.49 2.27 4.675 2.853 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.372 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                        </svg>
                      </a>
                    )}
                    {shelter.telegramUrl && (
                      <a href={shelter.telegramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-sky-100 text-sky-600 rounded-lg hover:bg-sky-200 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </a>
                    )}
                    {shelter.instagramUrl && (
                      <a href={shelter.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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
  );
}
