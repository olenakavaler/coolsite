import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { EventCard } from '@/components/EventCard';

export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  searchParams: {
    tab?: string;
  };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?next=/profile');
  }

  const activeTab = searchParams.tab === 'attending' ? 'attending' : 'created';

  // Fetch events created by user
  const createdEvents = await prisma.event.findMany({
    where: { ownerId: user.id },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { attendances: true } },
    },
    orderBy: { startsAt: 'desc' },
  });

  // Fetch events user has registered for (including private events!)
  const attendances = await prisma.attendance.findMany({
    where: { userId: user.id },
    include: {
      event: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { attendances: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const registeredEvents = attendances.map((a) => a.event);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
        </div>

        <Link
          href="/events/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          + Створити подію
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Вкладки">
          <Link
            href="/profile?tab=created"
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'created'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Створені мною ({createdEvents.length})
          </Link>
          <Link
            href="/profile?tab=attending"
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'attending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Я записався ({registeredEvents.length})
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'created' ? (
          createdEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
              <span className="text-5xl block mb-3">📅</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Ви ще не створили жодної події
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Організуйте мітап, вечірку або зустріч однодумців прямо зараз!
              </p>
              <Link
                href="/events/new"
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Створити першу подію
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdEvents.map((event) => (
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
          )
        ) : (
          registeredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8">
              <span className="text-5xl block mb-3">🎟️</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Ви ще не записалися на жодну подію
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Перегляньте список майбутніх подій на головній та приєднуйтесь!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Знайти подію
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map((event) => (
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
          )
        )}
      </div>
    </div>
  );
}
