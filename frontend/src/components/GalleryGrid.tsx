'use client';

import Image from 'next/image';
import { useState } from 'react';
import { GalleryImage } from '@/lib/gallery-api';
import { ImageModal } from './ImageModal';

interface GalleryGridProps {
  images: GalleryImage[];
  showAuthor?: boolean;
}

export function GalleryGrid({ images, showAuthor = true }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 mb-4"
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
        <p className="text-gray-500 text-lg">Изображения не найдены</p>
        <p className="text-gray-400 mt-2">Станьте первым, кто поделится фото питомца!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
          >
            <Image
              src={image.imageUrl}
              alt={image.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={image.imageUrl.includes('localhost')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <h3 className="font-medium text-sm truncate">{image.title}</h3>
                {showAuthor && (
                  <p className="text-xs text-gray-300 truncate">{image.user.name}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.imageUrl}
          title={selectedImage.title}
          author={selectedImage.user.name}
          pet={selectedImage.pet}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}
