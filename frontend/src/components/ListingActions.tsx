'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { favoritesApi, likesApi, listingsApi } from '@/lib/listings-api';
import { messagesApi } from '@/lib/messages-api';

interface ListingActionsProps {
  listingId: string;
  ownerId: string;
  initialIsFavorite: boolean;
  initialIsLiked: boolean;
  initialLikesCount: number;
  price: string;
}

export default function ListingActions({
  listingId,
  ownerId,
  initialIsFavorite,
  initialIsLiked,
  initialLikesCount,
  price,
}: ListingActionsProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [showPhone, setShowPhone] = useState(false);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const isOwner = user?.id === ownerId;

  const handleShowPhone = async () => {
    if (contactPhone) {
      setShowPhone(true);
      return;
    }

    setLoadingPhone(true);
    try {
      const data = await listingsApi.getContact(listingId);
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
        await favoritesApi.remove(listingId);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(listingId);
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
        const result = await likesApi.unlike(listingId);
        setIsLiked(false);
        setLikesCount(result.likesCount);
      } else {
        const result = await likesApi.like(listingId);
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

    setIsStartingChat(true);
    try {
      const conversation = await messagesApi.startConversation({
        userId: ownerId,
        listingId: listingId,
      });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="text-3xl font-bold text-green-600 mb-4">{price}</div>

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
  );
}
