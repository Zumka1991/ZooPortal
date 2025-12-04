import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { petsApi, animalTypeLabels, genderLabels, formatAge } from '@/lib/pets-api';
import PetComments from '@/components/PetComments';
import PetActions from '@/components/PetActions';

const ANIMAL_TYPE_ICONS: Record<string, string> = {
  Dog: '🐕', Cat: '🐈', Bird: '🐦', Fish: '🐠',
  Rodent: '🐹', Reptile: '🦎', Other: '🐾'
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://domzverei.ru';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const pet = await petsApi.getPet(id);
    const animalLabel = pet.animalType ? animalTypeLabels[pet.animalType] : 'Питомец';

    return {
      title: `${pet.name} - ${animalLabel} | DomZverei`,
      description: pet.description.substring(0, 160),
      openGraph: {
        title: pet.name,
        description: pet.description.substring(0, 160),
        url: `${BASE_URL}/pets/${id}`,
        type: 'website',
        images: [pet.mainImageUrl],
        locale: 'ru_RU',
      },
      alternates: {
        canonical: `${BASE_URL}/pets/${id}`,
      },
    };
  } catch {
    return { title: 'Питомец не найден | DomZverei' };
  }
}

export default async function PetDetailPage({ params }: Props) {
  const { id } = await params;

  let pet;
  try {
    pet = await petsApi.getPet(id);
  } catch {
    notFound();
  }

  const allImages = [
    { id: 'main', url: pet.mainImageUrl, isMain: true },
    ...pet.images.map(img => ({ id: img.id, url: img.imageUrl, isMain: img.isMain }))
  ];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pet.name,
    description: pet.description,
    image: pet.mainImageUrl,
    brand: {
      '@type': 'Person',
      name: pet.owner.name,
    },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      price: '0',
      priceCurrency: 'RUB',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/pets" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад к каталогу
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4">
                <div className="relative aspect-square bg-gray-100">
                  <Image src={allImages[0].url} alt={pet.name} fill className="object-cover" unoptimized={allImages[0].url.includes('localhost')} />
                </div>
              </div>
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.slice(1).map((image) => (
                    <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image src={image.url} alt={pet.name} fill className="object-cover" unoptimized={image.url.includes('localhost')} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{pet.name}</h1>
                  {pet.animalType && <div className="text-4xl">{ANIMAL_TYPE_ICONS[pet.animalType]}</div>}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {pet.animalType && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">{animalTypeLabels[pet.animalType]}</span>}
                  {pet.breed && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{pet.breed}</span>}
                  {pet.gender && <span className={`px-3 py-1 rounded-full text-sm font-medium ${pet.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>{genderLabels[pet.gender]}</span>}
                  {pet.ageMonths && <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{formatAge(pet.ageMonths)}</span>}
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{pet.description}</p>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Владелец</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex-shrink-0 overflow-hidden">
                      {pet.owner.avatarUrl ? (
                        <Image src={pet.owner.avatarUrl} alt={pet.owner.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                          {pet.owner.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{pet.owner.name}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <PetActions petId={id} ownerId={pet.owner.id} initialIsLiked={pet.isLiked} initialLikesCount={pet.likesCount} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <PetComments petId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
