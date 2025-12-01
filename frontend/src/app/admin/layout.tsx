'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Статьи', href: '/admin/articles', icon: '📝' },
  { name: 'Пользователи', href: '/admin/users', icon: '👥' },
  { name: 'Приюты', href: '/admin/shelters', icon: '🏠' },
  { name: 'Объявления', href: '/admin/listings', icon: '📋' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/admin/login');
    } else if (!['Admin', 'Moderator'].includes(user.role)) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Skip layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || !['Admin', 'Moderator'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <Link href="/admin" className="text-white text-xl font-bold">
            ZooPortal Admin
          </Link>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                  isActive ? 'bg-gray-800 text-white border-l-4 border-green-500' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-4 block text-center text-sm text-gray-400 hover:text-white"
          >
            ← Вернуться на сайт
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-800">
              {navigation.find((n) => pathname.startsWith(n.href))?.name || 'Админ-панель'}
            </h1>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
