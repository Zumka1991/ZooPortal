'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { petsApi, PetListItem } from '@/lib/pets-api';
import { useAuth } from '@/components/AuthProvider';
import PetGrid from '@/components/PetGrid';

export default function MyPetsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [pets, setPets] = useState<PetListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadPets();
  }, [isAuthenticated, router]);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petsApi.getMyPets();
      setPets(data);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мои питомцы</h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Загрузка...' : `Всего: ${pets.length}`}
            </p>
          </div>

          <Link
            href="/my-pets/new"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить питомца
          </Link>
        </div>

        {/* Pets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Загрузка питомцев...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">У вас пока нет питомцев</h2>
            <p className="text-gray-600 mb-6">Добавьте своего первого питомца!</p>
            <Link
              href="/my-pets/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить питомца
            </Link>
          </div>
        ) : (
          <PetGrid pets={pets} />
        )}
      </div>
    </div>
  );
}
