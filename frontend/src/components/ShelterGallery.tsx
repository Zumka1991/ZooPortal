'use client';

import { useState } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: string | number;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

interface ShelterGalleryProps {
  images: GalleryImage[];
  shelterName: string;
}

export default function ShelterGallery({ images, shelterName }: ShelterGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="aspect-video relative bg-gray-100">
        <Image
          src={images[selectedImage]?.imageUrl || '/placeholder.jpg'}
          alt={shelterName}
          fill
          className="object-cover"
          unoptimized={images[selectedImage]?.imageUrl.includes('localhost')}
        />
      </div>
      {images.length > 1 && (
        <div className="p-4 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedImage(idx)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedImage === idx ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <Image
                src={img.imageUrl}
                alt=""
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized={img.imageUrl.includes('localhost')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
