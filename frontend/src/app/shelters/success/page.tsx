import Link from 'next/link';

export default function ShelterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Приют отправлен на модерацию!
          </h1>

          <p className="text-gray-600 mb-6">
            Спасибо за добавление приюта! Наши модераторы проверят информацию
            и опубликуют приют в каталоге в ближайшее время.
          </p>

          <p className="text-sm text-gray-500 mb-8">
            Обычно модерация занимает от нескольких часов до 1-2 дней.
            Вы получите уведомление, когда приют будет одобрен.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shelters"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              К каталогу приютов
            </Link>
            <Link
              href="/shelters/new"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Добавить ещё
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
