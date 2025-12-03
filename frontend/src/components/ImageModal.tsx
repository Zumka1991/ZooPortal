'use client';

import Image from 'next/image';
import { useEffect, useCallback } from 'react';

interface ImageModalProps {
  imageUrl: string;
  title: string;
  author: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, title, author, onClose }: ImageModalProps) {
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
          </div>
        </div>
      </div>
    </div>
  );
}
