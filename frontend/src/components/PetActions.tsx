'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { petsApi } from '@/lib/pets-api';

interface PetActionsProps {
  petId: string;
  ownerId: string;
  initialIsLiked: boolean;
  initialLikesCount: number;
}

export default function PetActions({
  petId,
  ownerId,
  initialIsLiked,
  initialLikesCount,
}: PetActionsProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isOwner = user?.id === ownerId;
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        await petsApi.unlikePet(petId);
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await petsApi.likePet(petId);
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-3 w-full">
      <button
        onClick={handleLikeToggle}
        disabled={isLoading}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
          isLiked
            ? 'bg-red-50 text-red-600 border-2 border-red-500'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
        }`}
      >
        <svg
          className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span>{likesCount}</span>
      </button>

      {isOwner && (
        <button
          onClick={() => router.push(`/my-pets/${petId}/edit`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Редактировать
        </button>
      )}
    </div>
  );
}
