import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AttendanceButton } from '@/components/AttendanceButton';
import { CommentsSection } from '@/components/CommentsSection';
import { CopyTokenButton } from '@/components/CopyTokenButton';
import { RegenerateTokenButton } from '@/components/RegenerateTokenButton';
import { Calendar, Users, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  referrer: 'no-referrer',
};

interface PrivateEventPageProps {
  params: {
    token: string;
  };
}

export default async function PrivateEventPage({ params }: PrivateEventPageProps) {
  const { token } = params;
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { token },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { attendances: true } },
      comments: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event || event.visibility !== 'PRIVATE') {
    notFound();
  }

  const isOwner = Boolean(user && user.id === event.ownerId);

  // If owner, fetch detailed attendees list
  let attendeesList: Array<{ id: string; createdAt: Date; user: { name: string; email: string } }> = [];
  if (isOwner) {
    attendeesList = await prisma.attendance.findMany({
      where: { eventId: event.id },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Check if current user is registered
  let isRegistered = false;
  if (user) {
    const att = await prisma.attendance.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
    });
    isRegistered = Boolean(att);
  }

  const attendeesCount = event._count.attendances;
  const seatsLeft = Math.max(0, event.capacity - attendeesCount);
  const isFull = seatsLeft === 0;
  const isPast = new Date(event.startsAt) <= new Date();

  const formattedDate = new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(event.startsAt));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Private Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 text-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Це <strong>приватна подія</strong>. Доступ мають лише ті, хто володіє посиланням-запрошенням.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <CopyTokenButton token={token} />
          {isOwner && <RegenerateTokenButton eventId={event.id} />}
        </div>
      </div>

      {/* Header Cover */}
      <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 shadow-md flex items-center justify-center text-white">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-7xl select-none">🔒</span>
        )}
      </div>

      {/* Main Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium mb-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={new Date(event.startsAt).toISOString()}>
                {formattedDate}
              </time>
              {isPast && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  Минула подія
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Організатор: <span className="font-medium text-gray-700">{event.owner.name}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <AttendanceButton
              eventId={event.id}
              token={token}
              isLoggedIn={Boolean(user)}
              isOwner={isOwner}
              isRegistered={isRegistered}
              isFull={isFull}
              isPast={isPast}
              capacity={event.capacity}
              attendeesCount={attendeesCount}
            />

            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              {seatsLeft > 0 ? (
                <span>
                  Залишилось{' '}
                  <strong className="text-green-600 font-semibold">{seatsLeft}</strong> з{' '}
                  {event.capacity} місць
                </span>
              ) : (
                <strong className="text-red-500 font-semibold">Місць немає</strong>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="prose max-w-none">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Про подію</h2>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
            {event.description}
          </div>
        </div>

        {/* Author-only Participants Section */}
        {isOwner && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Список учасників ({attendeesList.length})
              </h2>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-full">
                Видно тільки автору
              </span>
            </div>

            {attendeesList.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                Поки що ніхто не записався на цю подію.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {attendeesList.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 flex items-center justify-between text-sm bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{att.user.name}</p>
                      <p className="text-xs text-gray-400">{att.user.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat('uk-UA', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(att.createdAt))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments */}
      <CommentsSection
        eventId={event.id}
        token={token}
        comments={event.comments}
        currentUserId={user?.id}
        isOwner={isOwner}
      />
    </div>
  );
}
