'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ListingImage {
  id: string;
  url: string;
  order: number;
}

interface ListingGalleryProps {
  images: ListingImage[];
  title: string;
  fallbackIcon: string;
}

export default function ListingGallery({ images, title, fallbackIcon }: ListingGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <span className="text-8xl">{fallbackIcon}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        <Image
          src={images[selectedImage]?.url}
          alt={title}
          fill
          className="object-contain"
          unoptimized={images[selectedImage]?.url.includes('localhost')}
        />
      </div>
      {images.length > 1 && (
        <div className="p-4 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedImage === index ? 'border-green-500' : 'border-transparent'
              }`}
            >
              <Image
                src={image.url}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized={image.url.includes('localhost')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
