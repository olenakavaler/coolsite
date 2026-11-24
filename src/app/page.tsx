import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { EventCard } from '@/components/EventCard';
import { Search } from 'lucide-react';
import { searchSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    q?: string;
    page?: string;
  };
}

const PAGE_SIZE = 20;

export default async function HomePage({ searchParams }: PageProps) {
  const parsed = searchSchema.safeParse(searchParams);
  const q = parsed.success ? parsed.data.q : '';
  const page = parsed.success ? parsed.data.page : 1;
  const skip = (page - 1) * PAGE_SIZE;

  const now = new Date();

  // Filter: ONLY UPCOMING and ONLY PUBLIC
  const whereClause: Prisma.EventWhereInput = {
    visibility: 'PUBLIC',
    startsAt: {
      gt: now,
    },
    ...(q && q.trim().length > 0
      ? {
          title: {
            contains: q.trim(),
          },
        }
      : {}),
  };

  const [events, totalCount] = await Promise.all([
    prisma.event.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startsAt: 'asc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-3">
          Зустрічайся та відпочивай з «Тусовкою»
        </h1>
        <p className="text-lg text-gray-600">
          Створюйте власні події, запрошуйте друзів та знаходьте однодумців.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto">
        <form method="GET" action="/" className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="Пошук подій за назвою..."
            className="w-full pl-11 pr-24 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Знайти
          </button>
        </form>
      </div>

      {/* Events Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {q ? `Результати пошуку: «${q}» (${totalCount})` : 'Майбутні події'}
          </h2>
          <span className="text-sm text-gray-500">Всього: {totalCount}</span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
            <span className="text-5xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Подій не знайдено
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {q
                ? 'За вашим запитом нічого не знайдено. Спробуйте змінити ключові слова.'
                : 'Наразі немає запланованих публічних подій. Створіть першу!'}
            </p>
            <Link
              href="/events/new"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Створити подію
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                description={event.description}
                startsAt={event.startsAt}
                capacity={event.capacity}
                coverImage={event.coverImage}
                visibility={event.visibility}
                token={event.token}
                attendeesCount={event._count.attendances}
                ownerName={event.owner.name}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors"
              >
                Назад
              </Link>
            )}

            <span className="text-sm text-gray-600 px-3">
              Сторінка {page} з {totalPages}
            </span>

            {page < totalPages && (
              <Link
                href={`/?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 transition-colors"
              >
                Вперед
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
