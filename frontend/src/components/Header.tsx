'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/shelters', label: 'Приюты' },
  { href: '/listings', label: 'Объявления' },
  { href: '/lost-found', label: 'Потеряшки' },
  { href: '/gallery', label: 'Галерея' },
  { href: '/articles', label: 'Статьи' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-bold text-green-600">ZooPortal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {(user.role === 'Admin' || user.role === 'Moderator') && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Админка
                  </Link>
                )}
                <span className="text-gray-700">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-green-600 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Меню"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-green-600 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-2" />
              {user ? (
                <>
                  {(user.role === 'Admin' || user.role === 'Moderator') && (
                    <Link
                      href="/admin"
                      className="text-green-600 font-medium py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Админка
                    </Link>
                  )}
                  <span className="text-gray-700 py-2">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600 py-2"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-green-600 transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
