'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PetListItem, animalTypeLabels, genderLabels, formatAge, petsApi } from '@/lib/pets-api';
import { useAuth } from '@/components/AuthProvider';

const ANIMAL_TYPE_ICONS: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Fish: '🐠',
  Rodent: '🐹',
  Reptile: '🦎',
  Other: '🐾'
};

interface PetCardProps {
  pet: PetListItem;
  onLikeChange?: (id: string, isLiked: boolean) => void;
}

export default function PetCard({ pet, onLikeChange }: PetCardProps) {
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(pet.isLiked);
  const [likesCount, setLikesCount] = useState(pet.likesCount);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await petsApi.unlikePet(pet.id);
        setIsLiked(false);
        setLikesCount(likesCount - 1);
        onLikeChange?.(pet.id, false);
      } else {
        await petsApi.likePet(pet.id);
        setIsLiked(true);
        setLikesCount(likesCount + 1);
        onLikeChange?.(pet.id, true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <Link href={`/pets/${pet.id}`} className="group block">
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100">
          {pet.mainImageUrl ? (
            <img
              src={pet.mainImageUrl}
              alt={pet.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {pet.animalType ? ANIMAL_TYPE_ICONS[pet.animalType] : '🐾'}
            </div>
          )}

          {/* Owner Avatar */}
          <div className="absolute bottom-3 right-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-lg overflow-hidden">
              {pet.owner.avatarUrl ? (
                <img src={pet.owner.avatarUrl} alt={pet.owner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-500 text-white font-semibold">
                  {pet.owner.name[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-green-600 transition-colors">
            {pet.name}
          </h3>

          {/* Animal Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {pet.animalType && <span>{animalTypeLabels[pet.animalType]}</span>}
            {pet.breed && (
              <>
                {pet.animalType && <span className="text-gray-300">|</span>}
                <span className="line-clamp-1">{pet.breed}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {pet.description}
          </p>

          {/* Details */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            {pet.ageMonths && <span>{formatAge(pet.ageMonths)}</span>}
            {pet.gender && (
              <span className={pet.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}>
                {genderLabels[pet.gender]}
              </span>
            )}
          </div>

          {/* Owner and Likes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="line-clamp-1">{pet.owner.name}</span>
            </div>

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
          </div>
        </div>
      </div>
    </Link>
  );
}
