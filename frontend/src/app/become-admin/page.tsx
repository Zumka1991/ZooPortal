'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';

export default function BecomeAdminPage() {
  const router = useRouter();
  const [secretPassword, setSecretPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getMe();
      if (!user) {
        router.push('/login?redirect=/become-admin');
        return;
      }
      if (user.role === 'Admin') {
        setSuccess('Вы уже являетесь администратором!');
      }
      setIsAuthenticated(true);
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await authService.grantAdmin(secretPassword);
      setSuccess(`Поздравляем, ${result.user.name}! Вы стали администратором.`);
      setSecretPassword('');
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при получении прав');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Получить права администратора
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Введите секретный пароль для получения админских прав
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="secretPassword" className="block text-sm font-medium text-gray-700">
                Секретный пароль
              </label>
              <div className="mt-1">
                <input
                  id="secretPassword"
                  name="secretPassword"
                  type="password"
                  required
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Введите секретный пароль"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !secretPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Проверка...' : 'Получить права'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">или</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-purple-600 hover:text-purple-500">
                Вернуться на главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
