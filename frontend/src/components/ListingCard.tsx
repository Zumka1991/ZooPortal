'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ListingListItem,
  ANIMAL_TYPE_LABELS,
  ANIMAL_TYPE_ICONS,
  LISTING_TYPE_LABELS,
  LISTING_TYPE_COLORS,
  GENDER_LABELS,
  formatAge,
  formatPrice,
  favoritesApi,
  likesApi,
} from '@/lib/listings-api';
import { useAuth } from '@/components/AuthProvider';

interface ListingCardProps {
  listing: ListingListItem;
  onFavoriteChange?: (id: string, isFavorite: boolean) => void;
  showStatus?: boolean;
}

export default function ListingCard({ listing, onFavoriteChange, showStatus = false }: ListingCardProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(listing.isFavorite);
  const [isLiked, setIsLiked] = useState(listing.isLiked);
  const [likesCount, setLikesCount] = useState(listing.likesCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoritesApi.remove(listing.id);
        setIsFavorite(false);
        onFavoriteChange?.(listing.id, false);
      } else {
        await favoritesApi.add(listing.id);
        setIsFavorite(true);
        onFavoriteChange?.(listing.id, true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        const result = await likesApi.unlike(listing.id);
        setIsLiked(false);
        setLikesCount(result.likesCount);
      } else {
        const result = await likesApi.like(listing.id);
        setIsLiked(true);
        setLikesCount(result.likesCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {listing.mainImageUrl ? (
            <img
              src={listing.mainImageUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {ANIMAL_TYPE_ICONS[listing.animalType]}
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${LISTING_TYPE_COLORS[listing.type]}`}>
              {LISTING_TYPE_LABELS[listing.type]}
            </span>
          </div>

          {/* Favorite Button */}
          {isAuthenticated && (
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
            >
              {isFavorite ? (
                <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Shelter Badge */}
          {listing.shelter && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-xs">
              {listing.shelter.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-gray-700">{listing.shelter.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
            {listing.title}
          </h3>

          {/* Animal Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>{ANIMAL_TYPE_LABELS[listing.animalType]}</span>
            {listing.breed && (
              <>
                <span className="text-gray-300">|</span>
                <span className="line-clamp-1">{listing.breed}</span>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            {listing.age && <span>{formatAge(listing.age)}</span>}
            {listing.gender && (
              <span className={listing.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}>
                {GENDER_LABELS[listing.gender]}
              </span>
            )}
          </div>

          {/* City */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{listing.city.name}</span>
          </div>

          {/* Price and Likes */}
          <div className="flex items-center justify-between">
            <span className={`font-bold ${listing.type === 'GiveAway' ? 'text-purple-600' : 'text-green-600'}`}>
              {formatPrice(listing.price, listing.type)}
            </span>

            <div className="flex items-center gap-2">
              {/* Like Button */}
              <button
                onClick={handleLikeClick}
                disabled={isLikeLoading || !isAuthenticated}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                  isLiked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                } ${!isAuthenticated ? 'cursor-default' : ''}`}
              >
                <svg
                  className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
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
                <span>{likesCount}</span>
              </button>

              {showStatus && listing.status !== 'Active' && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  listing.status === 'Moderation' ? 'bg-yellow-100 text-yellow-800' :
                  listing.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {listing.status === 'Moderation' ? 'На модерации' :
                   listing.status === 'Closed' ? 'Закрыто' : 'Истёк срок'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
