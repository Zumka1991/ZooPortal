'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { petsApi, PetDetail, animalTypeLabels, genderLabels, formatAge } from '@/lib/pets-api';
import { useAuth } from '@/components/AuthProvider';
import PetComments from '@/components/PetComments';

const ANIMAL_TYPE_ICONS: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐈',
  Bird: '🐦',
  Fish: '🐠',
  Rodent: '🐹',
  Reptile: '🦎',
  Other: '🐾'
};

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const id = params.id as string;

  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadPet = async () => {
      try {
        const data = await petsApi.getPet(id);
        setPet(data);
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      } catch (err) {
        setError('Питомец не найден');
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [id]);

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await petsApi.unlikePet(id);
        setIsLiked(false);
        setLikesCount(likesCount - 1);
      } else {
        await petsApi.likePet(id);
        setIsLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этого питомца?')) return;

    try {
      await petsApi.deletePet(id);
      router.push('/my-pets');
    } catch (err) {
      console.error('Error deleting pet:', err);
      alert('Не удалось удалить питомца');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Питомец не найден'}</h2>
          <Link href="/pets" className="text-green-600 hover:underline">
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const allImages = [
    { id: 'main', url: pet.mainImageUrl, isMain: true },
    ...pet.images.map(img => ({ id: img.id, url: img.imageUrl, isMain: img.isMain }))
  ];

  const isOwner = user?.id === pet.owner.id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/pets"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к каталогу
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={allImages[selectedImage].url}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden ${
                      index === selectedImage ? 'ring-2 ring-green-600' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${pet.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              {/* Pet Name */}
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                {pet.animalType && (
                  <div className="text-4xl">{ANIMAL_TYPE_ICONS[pet.animalType]}</div>
                )}
              </div>

              {/* Info Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {pet.animalType && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {animalTypeLabels[pet.animalType]}
                  </span>
                )}
                {pet.breed && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {pet.breed}
                  </span>
                )}
                {pet.gender && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    pet.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {genderLabels[pet.gender]}
                  </span>
                )}
                {pet.ageMonths && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {formatAge(pet.ageMonths)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{pet.description}</p>
              </div>

              {/* Owner */}
              <div className="border-t pt-4 mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Владелец</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex-shrink-0 overflow-hidden">
                    {pet.owner.avatarUrl ? (
                      <img src={pet.owner.avatarUrl} alt={pet.owner.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                        {pet.owner.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{pet.owner.name}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {isOwner ? (
                  <>
                    <Link
                      href={`/my-pets/${id}/edit`}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Удалить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleLikeToggle}
                    disabled={isLikeLoading}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isLiked
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
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
                    {isLiked ? 'В избранном' : 'В избранное'} ({likesCount})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-8">
          <PetComments petId={id} />
        </div>
      </div>
    </div>
  );
}
