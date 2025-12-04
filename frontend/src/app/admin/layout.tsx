'use client';

import { useAuth } from '@/components/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Статьи', href: '/admin/articles', icon: '📝' },
  { name: 'Статические страницы', href: '/admin/static-pages', icon: '📄' },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col bg-gray-900">
        <div className="flex items-center justify-center h-16 bg-gray-800">
          <Link href="/admin" className="text-white text-lg font-bold">
            DomZverei Admin
          </Link>
        </div>
        <nav className="mt-8 flex-1">
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
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="block text-center text-sm text-gray-400 hover:text-white"
          >
            ← Вернуться на сайт
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-900 z-50 transform transition-transform duration-300 md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 bg-gray-800 px-4">
          <Link href="/admin" className="text-white text-lg font-bold">
            DomZverei Admin
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
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
          <Link
            href="/"
            className="block text-center text-sm text-gray-400 hover:text-white"
          >
            ← Вернуться на сайт
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg md:text-xl font-semibold text-gray-800">
                {navigation.find((n) => pathname.startsWith(n.href))?.name || 'Админ-панель'}
              </h1>
            </div>
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
