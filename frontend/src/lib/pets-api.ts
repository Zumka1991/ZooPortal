import { authService } from './auth';
import { getApiUrl } from './api-url';

// === Types ===

export type AnimalType = 'Dog' | 'Cat' | 'Bird' | 'Fish' | 'Rodent' | 'Reptile' | 'Other';
export type Gender = 'Male' | 'Female';

export interface PetOwner {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PetImage {
  id: string;
  imageUrl: string;
  isMain: boolean;
  sortOrder: number;
}

export interface PetComment {
  id: string;
  text: string;
  user: PetOwner;
  createdAt: string;
}

export interface PetListItem {
  id: string;
  name: string;
  description: string;
  animalType?: AnimalType;
  breed?: string;
  gender?: Gender;
  ageMonths?: number;
  mainImageUrl: string;
  owner: PetOwner;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PetDetail extends PetListItem {
  birthDate?: string;
  isPublic: boolean;
  images: PetImage[];
  commentsCount: number;
  updatedAt?: string;
}

export interface PetsPagedResponse {
  items: PetListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserPet {
  id: string;
  name: string;
  animalType?: AnimalType;
  mainImageUrl: string;
}

export interface CreatePetRequest {
  name: string;
  description: string;
  animalType?: AnimalType;
  breed?: string;
  gender?: Gender;
  birthDate?: string;
  ageMonths?: number;
  isPublic: boolean;
}

export interface UpdatePetRequest extends CreatePetRequest {}

export interface CreateCommentRequest {
  text: string;
}

// === Label mappings ===

export const animalTypeLabels: Record<AnimalType, string> = {
  Dog: 'Собака',
  Cat: 'Кошка',
  Bird: 'Птица',
  Fish: 'Рыбка',
  Rodent: 'Грызун',
  Reptile: 'Рептилия',
  Other: 'Другое'
};

export const genderLabels: Record<Gender, string> = {
  Male: 'Самец',
  Female: 'Самка'
};

// === Helper functions ===

export function formatAge(ageMonths?: number): string {
  if (!ageMonths) return 'Возраст не указан';

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (years === 0) return `${months} мес.`;
  if (months === 0) return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} ${months} мес.`;
}

// === API Class ===

class PetsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
  }

  // Get public pets catalog
  async getPets(params?: {
    animalType?: AnimalType;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PetsPagedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.animalType) queryParams.append('animalType', params.animalType);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${this.baseUrl}/pets${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }

    return response.json();
  }

  // Get user's pets
  async getMyPets(): Promise<PetListItem[]> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.getMyPets();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch my pets');
    }

    return response.json();
  }

  // Get user's pets (simplified for forms)
  async getMyPetsSimple(): Promise<UserPet[]> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/my/simple`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.getMyPetsSimple();
    }

    if (!response.ok) {
      throw new Error('Failed to fetch my pets');
    }

    return response.json();
  }

  // Get pet details
  async getPet(id: string): Promise<PetDetail> {
    const token = authService.getAccessToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/pets/${id}`, { headers });

    if (response.status === 401 && token) {
      await authService.refresh();
      return this.getPet(id);
    }

    if (!response.ok) {
      throw new Error('Pet not found');
    }

    return response.json();
  }

  // Create pet
  async createPet(request: CreatePetRequest, mainImage: File): Promise<PetDetail> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('description', request.description);
    if (request.animalType) formData.append('animalType', request.animalType);
    if (request.breed) formData.append('breed', request.breed);
    if (request.gender) formData.append('gender', request.gender);
    if (request.birthDate) formData.append('birthDate', request.birthDate);
    if (request.ageMonths) formData.append('ageMonths', request.ageMonths.toString());
    formData.append('isPublic', request.isPublic.toString());
    formData.append('mainImage', mainImage);

    const response = await fetch(`${this.baseUrl}/pets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.createPet(request, mainImage);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create pet');
    }

    return response.json();
  }

  // Update pet
  async updatePet(id: string, request: UpdatePetRequest): Promise<PetDetail> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.updatePet(id, request);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update pet');
    }

    return response.json();
  }

  // Delete pet
  async deletePet(id: string): Promise<void> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.deletePet(id);
    }

    if (!response.ok) {
      throw new Error('Failed to delete pet');
    }
  }

  // Add image to pet
  async addImage(petId: string, image: File): Promise<PetImage> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch(`${this.baseUrl}/pets/${petId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.addImage(petId, image);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add image');
    }

    return response.json();
  }

  // Delete image
  async deleteImage(petId: string, imageId: string): Promise<void> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.deleteImage(petId, imageId);
    }

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  }

  // Set main image
  async setMainImage(petId: string, imageId: string): Promise<void> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/images/${imageId}/main`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.setMainImage(petId, imageId);
    }

    if (!response.ok) {
      throw new Error('Failed to set main image');
    }
  }

  // Like pet
  async likePet(petId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return this.likePet(petId);
      throw new Error('Not authenticated');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Like pet error:', response.status, errorText);
      throw new Error(`Failed to like pet: ${response.status}`);
    }

    return response.json();
  }

  // Get like status (for hydrating client state)
  async getLikeStatus(petId: string): Promise<{ likesCount: number; isLiked: boolean } | null> {
    const token = authService.getAccessToken();
    if (!token) return null;

    const response = await fetch(`${this.baseUrl}/pets/${petId}/like-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return this.getLikeStatus(petId);
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  // Unlike pet
  async unlikePet(petId: string): Promise<{ likesCount: number; isLiked: boolean }> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/like`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return this.unlikePet(petId);
      throw new Error('Not authenticated');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unlike pet error:', response.status, errorText);
      throw new Error(`Failed to unlike pet: ${response.status}`);
    }

    return response.json();
  }

  // Get comments
  async getComments(petId: string): Promise<PetComment[]> {
    const response = await fetch(`${this.baseUrl}/pets/${petId}/comments`);

    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  }

  // Add comment
  async addComment(petId: string, request: CreateCommentRequest): Promise<PetComment> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.addComment(petId, request);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add comment');
    }

    return response.json();
  }

  // Delete comment
  async deleteComment(petId: string, commentId: string): Promise<void> {
    const token = authService.getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/pets/${petId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      await authService.refresh();
      return this.deleteComment(petId, commentId);
    }

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
  }
}

export const petsApi = new PetsApi();
