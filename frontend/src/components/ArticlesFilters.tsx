'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_LABELS, ANIMAL_TYPE_LABELS } from '@/lib/articles-api';

const CATEGORIES = Object.entries(CATEGORY_LABELS);
const ANIMAL_TYPES = Object.entries(ANIMAL_TYPE_LABELS);

interface Props {
  currentCategory: string;
  currentAnimalType: string;
  currentSearch: string;
}

export function ArticlesFilters({ currentCategory, currentAnimalType, currentSearch }: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = (updates: { category?: string; animalType?: string; search?: string }) => {
    const params = new URLSearchParams();

    const category = updates.category ?? currentCategory;
    const animalType = updates.animalType ?? currentAnimalType;
    const search = updates.search ?? currentSearch;

    if (category) params.set('category', category);
    if (animalType) params.set('animalType', animalType);
    if (search) params.set('search', search);

    const query = params.toString();
    router.push(`/articles${query ? `?${query}` : ''}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const resetFilters = () => {
    setSearchInput('');
    router.push('/articles');
  };

  const hasFilters = currentCategory || currentAnimalType || currentSearch;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по статьям..."
            className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Найти
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Категория
          </label>
          <select
            value={currentCategory}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
          >
            <option value="">Все категории</option>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип животного
          </label>
          <select
            value={currentAnimalType}
            onChange={(e) => updateFilters({ animalType: e.target.value })}
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500"
          >
            <option value="">Все животные</option>
            {ANIMAL_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
