import { getApiUrl } from './api-url';
import { authService } from './auth';

export enum UserRole {
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin'
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  listingsCount: number;
  galleryImagesCount: number;
  lostFoundPostsCount: number;
  sheltersCount: number;
  updatedAt: string | null;
}

export interface UsersPagedResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.User]: 'Пользователь',
  [UserRole.Moderator]: 'Модератор',
  [UserRole.Admin]: 'Администратор'
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.User]: 'bg-gray-100 text-gray-800',
  [UserRole.Moderator]: 'bg-blue-100 text-blue-800',
  [UserRole.Admin]: 'bg-purple-100 text-purple-800'
};

export const adminUsersApi = {
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }): Promise<UsersPagedResponse> => {
    const token = authService.getAccessToken();
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.role !== undefined) queryParams.set('role', params.role.toString());
    if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());
    if (params?.search) queryParams.set('search', params.search);

    const url = `${getApiUrl()}/admin/users${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return adminUsersApi.getUsers(params);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/admin/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return adminUsersApi.getUser(id);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  },

  updateRole: async (id: string, role: UserRole): Promise<any> => {
    const token = authService.getAccessToken();

    console.log('Sending updateRole request:', { id, role, roleLabel: USER_ROLE_LABELS[role] });

    const response = await fetch(`${getApiUrl()}/admin/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return adminUsersApi.updateRole(id, role);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('Update role failed:', error);
      throw new Error(error.message || 'Failed to update role');
    }

    const result = await response.json();
    console.log('Update role response:', result);
    return result;
  },

  updateStatus: async (id: string, isActive: boolean): Promise<void> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive })
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return adminUsersApi.updateStatus(id, isActive);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update status');
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    const token = authService.getAccessToken();
    const response = await fetch(`${getApiUrl()}/admin/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      const refreshed = await authService.refresh();
      if (refreshed) return adminUsersApi.deleteUser(id);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete user');
    }
  }
};
