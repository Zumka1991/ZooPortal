import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-white">DomZverei</span>
            </div>
            <p className="text-sm">
              Портал помощи животным. Найди друга, помоги приюту, подари дом.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Разделы</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shelters" className="hover:text-white transition-colors">
                  Приюты
                </Link>
              </li>
              <li>
                <Link href="/listings" className="hover:text-white transition-colors">
                  Объявления
                </Link>
              </li>
              <li>
                <Link href="/lost-found" className="hover:text-white transition-colors">
                  Потеряшки
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-white transition-colors">
                  Статьи
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4">Помощь</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  О проекте
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-white transition-colors">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} DomZverei. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
