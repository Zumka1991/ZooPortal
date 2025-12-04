'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { galleryApi } from '@/lib/gallery-api';
import { petsApi, UserPet } from '@/lib/pets-api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [myPets, setMyPets] = useState<UserPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [loadingPets, setLoadingPets] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingPets(true);
      petsApi.getMyPetsSimple()
        .then(pets => setMyPets(pets))
        .catch(err => console.error('Error loading pets:', err))
        .finally(() => setLoadingPets(false));
    }
  }, [isAuthenticated]);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setError('');

    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Разрешены только изображения: JPG, PNG, GIF, WebP');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Введите название');
      return;
    }

    if (!file) {
      setError('Выберите изображение');
      return;
    }

    setIsUploading(true);

    try {
      await galleryApi.upload(title.trim(), file, selectedPetId || undefined);
      router.push('/gallery/my');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      setIsUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Требуется авторизация</h1>
          <p className="text-gray-600 mb-6">Войдите, чтобы загрузить фотографию</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/gallery"
            className="text-purple-600 hover:text-purple-700 font-medium flex items-center"
          >
            ← Назад к галерее
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Загрузить фото питомца</h1>
          <p className="text-gray-600 mb-8">
            Поделитесь фотографией своего любимца с сообществом. После модерации она появится в общей галерее.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Название фотографии
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Например: Мой кот Барсик на солнышке"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200 символов</p>
            </div>

            {/* Pet Selection */}
            <div>
              <label htmlFor="pet" className="block text-sm font-medium text-gray-700 mb-2">
                Привязать к питомцу <span className="text-gray-400">(необязательно)</span>
              </label>
              {loadingPets ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  Загрузка питомцев...
                </div>
              ) : myPets.length > 0 ? (
                <select
                  id="pet"
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Не привязывать</option>
                  {myPets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} {pet.animalType ? `(${pet.animalType})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500">
                  У вас пока нет питомцев.{' '}
                  <Link href="/my-pets/new" className="text-purple-600 hover:underline">
                    Добавить питомца
                  </Link>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Изображение
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}
                  ${preview ? 'border-solid' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {preview ? (
                  <div className="relative">
                    <Image
                      src={preview}
                      alt="Preview"
                      width={400}
                      height={300}
                      className="mx-auto max-h-64 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm text-gray-600 mt-4">{file?.name}</p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-600 mb-2">
                      Перетащите изображение сюда или <span className="text-purple-600 font-medium">нажмите для выбора</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF или WebP. Максимум 5MB.
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Правила публикации:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Загружайте только фото своих питомцев</li>
                    <li>Фотографии проходят модерацию перед публикацией</li>
                    <li>Запрещены оскорбительные или неуместные изображения</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !title.trim() || !file}
              className="w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Загрузка...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Загрузить
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
