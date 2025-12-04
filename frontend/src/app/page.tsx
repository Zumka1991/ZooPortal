'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {user ? `Добро пожаловать, ${user.name}!` : 'Найди друга, подари дом'}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100">
            Портал помощи животным — приюты, объявления, полезные статьи
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/listings"
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Смотреть объявления
            </Link>
            <Link
              href="/shelters"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
            >
              Найти приют
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Что мы предлагаем</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="🏠"
              title="Приюты"
              description="Каталог приютов с контактами и информацией о животных"
              href="/shelters"
            />
            <FeatureCard
              icon="📋"
              title="Объявления"
              description="Продажа, покупка и отдача животных в добрые руки"
              href="/listings"
            />
            <FeatureCard
              icon="🔍"
              title="Потеряшки"
              description="Поиск потерянных питомцев и объявления о найденных"
              href="/lost-found"
            />
            <FeatureCard
              icon="📚"
              title="Статьи"
              description="Полезные материалы по уходу за животными"
              href="/articles"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {user ? (
            // Для авторизованных пользователей - быстрые действия
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Быстрые действия</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Что бы вы хотели сделать сегодня?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Link
                  href="/listings/new"
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group"
                >
                  <div className="text-4xl mb-3">📝</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">
                    Создать объявление
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Разместите объявление о продаже или отдаче питомца
                  </p>
                </Link>
                <Link
                  href="/gallery/upload"
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group"
                >
                  <div className="text-4xl mb-3">📷</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">
                    Добавить фото
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Загрузите фотографии своих питомцев в галерею
                  </p>
                </Link>
                <Link
                  href="/shelters/new"
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 group"
                >
                  <div className="text-4xl mb-3">🏠</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">
                    Добавить приют
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Зарегистрируйте приют для животных
                  </p>
                </Link>
              </div>
            </div>
          ) : (
            // Для неавторизованных пользователей - призыв к регистрации
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">Хотите помочь?</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Зарегистрируйтесь, чтобы размещать объявления, помогать приютам
                и находить новых друзей для животных.
              </p>
              <Link
                href="/register"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block"
              >
                Присоединиться
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
