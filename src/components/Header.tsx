import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { LogoutForm } from './LogoutForm';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link
            href="/"
            className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            🎉 Тусовка
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Головна
            </Link>

            {user ? (
              <>
                <Link
                  href="/events/new"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Створити
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Профіль
                </Link>
                <LogoutForm />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Увійти
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  Реєстрація
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
