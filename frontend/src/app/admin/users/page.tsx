'use client';

import { useState, useEffect } from 'react';
import { adminUsersApi, AdminUser, UserRole, USER_ROLE_LABELS, USER_ROLE_COLORS } from '@/lib/admin-users-api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadUsers = async (page: number) => {
    try {
      setLoading(true);
      const response = await adminUsersApi.getUsers({
        page,
        pageSize: 20,
        search: search || undefined,
        role: roleFilter !== '' ? roleFilter : undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      });

      console.log('Loaded users:', response.items);
      setUsers(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load users:', error);
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, [search, roleFilter, statusFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    console.log('Changing role for user', userId, 'to', newRole);
    if (!confirm('Изменить роль пользователя?')) return;

    try {
      await adminUsersApi.updateRole(userId, newRole as UserRole);
      console.log('Role updated successfully');
      await loadUsers(currentPage);
      alert('Роль обновлена');
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.message || 'Ошибка обновления роли');
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'деактивировать' : 'активировать';
    if (!confirm(`Вы уверены, что хотите ${action} пользователя?`)) return;

    try {
      await adminUsersApi.updateStatus(userId, !currentStatus);
      await loadUsers(currentPage);
      alert('Статус обновлён');
    } catch (error: any) {
      alert(error.message || 'Ошибка обновления статуса');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить пользователя? Это действие необратимо!')) return;

    try {
      await adminUsersApi.deleteUser(userId);
      await loadUsers(currentPage);
      alert('Пользователь удалён');
    } catch (error: any) {
      alert(error.message || 'Ошибка удаления пользователя');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Пользователи</h1>

      {/* Фильтры */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Email, имя, телефон..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value === '' ? '' : e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все роли</option>
              <option value={UserRole.User}>Пользователь</option>
              <option value={UserRole.Moderator}>Модератор</option>
              <option value={UserRole.Admin}>Администратор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Пользователи не найдены</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата регистрации
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${USER_ROLE_COLORS[user.role]}`}>
                          {USER_ROLE_LABELS[user.role]}
                        </span>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={UserRole.User}>→ Пользователь</option>
                          <option value={UserRole.Moderator}>→ Модератор</option>
                          <option value={UserRole.Admin}>→ Администратор</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Активен' : 'Неактивен'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => loadUsers(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => loadUsers(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Страница <span className="font-medium">{currentPage}</span> из{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => loadUsers(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => loadUsers(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Вперёд
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
