'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useCallback } from 'react';
import { GalleryPet } from '@/lib/gallery-api';

interface ImageModalProps {
  imageUrl: string;
  title: string;
  author: string;
  pet?: GalleryPet;
  onClose: () => void;
}

export function ImageModal({ imageUrl, title, author, pet, onClose }: ImageModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          <div className="relative aspect-auto max-h-[70vh]">
            <Image
              src={imageUrl}
              alt={title}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[70vh] object-contain"
              unoptimized={imageUrl.includes('localhost')}
              priority
            />
          </div>
          <div className="p-4 bg-white">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600 mt-1">Автор: {author}</p>
            {pet && (
              <Link
                href={`/pets/${pet.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 mt-3 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Питомец: <span className="font-medium">{pet.name}</span></span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
