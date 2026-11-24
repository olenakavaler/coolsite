'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { attendEvent, cancelAttendance } from '@/app/actions/attend';
import { useToast } from '@/app/providers';

interface AttendanceButtonProps {
  eventId: string;
  token?: string | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  isRegistered: boolean;
  isFull: boolean;
  isPast: boolean;
  capacity: number;
  attendeesCount: number;
}

export function AttendanceButton({
  eventId,
  token,
  isLoggedIn,
  isOwner,
  isRegistered,
  isFull,
  isPast,
}: AttendanceButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  if (isOwner) {
    return (
      <Link
        href={`/events/${eventId}/edit`}
        className="inline-flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200 px-6 py-3 rounded-lg font-medium text-sm transition-colors"
      >
        Редагувати подію
      </Link>
    );
  }

  if (isPast) {
    return (
      <button
        disabled
        className="bg-gray-100 text-gray-400 px-6 py-3 rounded-lg font-medium text-sm cursor-not-allowed"
      >
        Подія вже відбулася
      </button>
    );
  }

  if (!isLoggedIn) {
    const nextUrl = token ? `/e/${token}` : `/events/${eventId}`;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(nextUrl)}`}
        className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-sm"
      >
        Увійти, щоб піти
      </Link>
    );
  }

  if (isRegistered) {
    return (
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const res = await cancelAttendance(eventId, token);
            if (res?.error) {
              addToast(res.error, 'error');
            } else {
              addToast(res?.message || 'Запис скасовано', 'info');
            }
          });
        }}
        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-6 py-3 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Скасування...' : 'Скасувати запис'}
      </button>
    );
  }

  if (isFull) {
    return (
      <button
        disabled
        className="bg-gray-200 text-gray-500 px-6 py-3 rounded-lg font-medium text-sm cursor-not-allowed"
      >
        Місць немає
      </button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await attendEvent(eventId, token);
          if (res?.error) {
            addToast(res.error, 'error');
          } else {
            addToast(res?.message || 'Ви записалися!', 'success');
          }
        });
      }}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-sm disabled:opacity-50 shadow-sm transition-colors"
    >
      {isPending ? 'Запис...' : 'Іду!'}
    </button>
  );
}
