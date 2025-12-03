'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  listingsApi,
  favoritesApi,
  likesApi,
  ListingDetail,
  ANIMAL_TYPE_LABELS,
  ANIMAL_TYPE_ICONS,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_COLORS,
  GENDER_LABELS,
  formatAge,
  formatPrice,
} from '@/lib/listings-api';
import { messagesApi } from '@/lib/messages-api';
import { useAuth } from '@/components/AuthProvider';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const id = params.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const loadListing = async () => {
      try {
        const data = await listingsApi.getListing(id);
        setListing(data);
        setIsFavorite(data.isFavorite);
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      } catch (err) {
        setError('Объявление не найдено');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

  const handleShowPhone = async () => {
    if (contactPhone) {
      setShowPhone(true);
      return;
    }

    setLoadingPhone(true);
    try {
      const data = await listingsApi.getContact(id);
      setContactPhone(data.contactPhone || 'Не указан');
      setShowPhone(true);
    } catch (err) {
      console.error('Error loading contact:', err);
    } finally {
      setLoadingPhone(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesApi.remove(id);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        const result = await likesApi.unlike(id);
        setIsLiked(false);
        setLikesCount(result.likesCount);
      } else {
        const result = await likesApi.like(id);
        setIsLiked(true);
        setLikesCount(result.likesCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!listing) return;

    setIsStartingChat(true);
    try {
      const conversation = await messagesApi.startConversation({
        userId: listing.owner.id,
        listingId: id,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <Link href="/listings" className="text-green-600 hover:text-green-700">
            Вернуться к объявлениям
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner.id;

  return (
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
            {isOwner && (
              <Link
                href={`/listings/${id}/edit`}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Редактировать
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {listing.images.length > 0 ? (
                <>
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={listing.images[selectedImage]?.url}
                      alt={listing.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {listing.images.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {listing.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-green-500' : 'border-transparent'
                          }`}
                        >
                          <img src={image.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <span className="text-8xl">{ANIMAL_TYPE_ICONS[listing.animalType]}</span>
                </div>
              )}
            </div>

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
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600 mb-4">
                {formatPrice(listing.price, listing.type)}
              </div>

              {/* Show Phone Button */}
              <button
                onClick={handleShowPhone}
                disabled={loadingPhone}
                className="w-full mb-3 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loadingPhone ? (
                  'Загрузка...'
                ) : showPhone ? (
                  <a href={`tel:${contactPhone}`} className="block">
                    {contactPhone}
                  </a>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Показать телефон
                  </span>
                )}
              </button>

              {/* Write Message Button */}
              {!isOwner && (
                <button
                  onClick={handleStartChat}
                  disabled={isStartingChat}
                  className="w-full mb-3 px-4 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {isStartingChat ? 'Загрузка...' : 'Написать'}
                  </span>
                </button>
              )}

              {/* Like and Favorite Buttons */}
              <div className="flex gap-3 mb-3">
                {/* Like Button */}
                <button
                  onClick={handleLikeToggle}
                  disabled={isLikeLoading}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold border-2 transition-colors ${
                    isLiked
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
                      fill={isLiked ? 'currentColor' : 'none'}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {likesCount}
                  </span>
                </button>

                {/* Favorite Button */}
                <button
                  onClick={handleFavoriteToggle}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold border-2 transition-colors ${
                    isFavorite
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isFavorite ? (
                      <>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        В избранном
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        В избранное
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

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
                      <img
                        src={listing.shelter.logoUrl}
                        alt={listing.shelter.name}
                        className="w-12 h-12 rounded-full object-cover"
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
  );
}
