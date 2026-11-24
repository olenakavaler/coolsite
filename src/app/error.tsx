'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Щось пішло не так
      </h1>
      <p className="text-gray-600 mb-8">
        Виникла непередбачена помилка. Спробуйте ще раз.
      </p>
      <button
        onClick={reset}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
      >
        Спробувати ще раз
      </button>
    </div>
  );
}
