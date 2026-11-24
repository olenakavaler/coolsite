import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Сторінку не знайдено
      </h2>
      <p className="text-gray-600 mb-8">
        Ця сторінка не існує або була видалена.
      </p>
      <Link
        href="/"
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium inline-block transition-colors"
      >
        На головну
      </Link>
    </div>
  );
}
