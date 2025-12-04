import { PetListItem } from '@/lib/pets-api';
import PetCard from './PetCard';

interface PetGridProps {
  pets: PetListItem[];
  onLikeChange?: (id: string, isLiked: boolean) => void;
}

export default function PetGrid({ pets, onLikeChange }: PetGridProps) {
  if (pets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🐾</div>
        <p className="text-gray-500 text-lg">Питомцы не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} onLikeChange={onLikeChange} />
      ))}
    </div>
  );
}
