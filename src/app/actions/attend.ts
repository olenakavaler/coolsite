'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireUser, canViewEvent } from '@/lib/access';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/utils';
import type { ActionState } from '@/lib/validation';

export async function attendEvent(
  eventId: string,
  token?: string | null,
): Promise<ActionState> {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return { error: 'Необхідно увійти в систему' };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = rateLimit(`attend:${user.id}:${ip}`, 20, 60 * 1000);
  if (!limit.success) {
    return { error: 'Забагато запитів. Зачекайте хвилину.' };
  }

  // Access check: can user see this event?
  const event = await canViewEvent(eventId, token);
  if (!event) {
    return { error: 'Подію не знайдено' };
  }

  // Rule: Author CANNOT register for their own event
  if (event.ownerId === user.id) {
    return { error: 'Автор не може записатися на власну подію' };
  }

  // Rule: Registration for past event is forbidden
  if (new Date(event.startsAt) <= new Date()) {
    return { error: 'Запис на минулу подію заборонений' };
  }

  // Transaction with atomic capacity check to prevent overbooking & race conditions
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if user is already registered (idempotency)
      const existing = await tx.attendance.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      if (existing) {
        return { alreadyRegistered: true };
      }

      // 2. Count current attendees inside the transaction
      const currentCount = await tx.attendance.count({
        where: { eventId },
      });

      // 3. Prevent overbooking
      if (currentCount >= event.capacity) {
        throw new Error('NO_SEATS');
      }

      // 4. Create attendance record
      await tx.attendance.create({
        data: {
          eventId,
          userId: user.id,
        },
      });

      return { registered: true };
    });

    revalidatePath(`/events/${eventId}`);
    if (token) revalidatePath(`/e/${token}`);
    revalidatePath('/profile');

    if (result.alreadyRegistered) {
      return { message: 'Ви вже записані на цю подію' };
    }

    return { message: 'Ви успішно записалися на подію!' };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'NO_SEATS') {
      return { error: 'Місць немає' };
    }
    // Unique constraint violation handled idempotently
    return { error: 'Помилка запису на подію. Спробуйте ще раз.' };
  }
}

export async function cancelAttendance(
  eventId: string,
  token?: string | null,
): Promise<ActionState> {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return { error: 'Необхідно увійти в систему' };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = rateLimit(`cancel-attend:${user.id}:${ip}`, 20, 60 * 1000);
  if (!limit.success) {
    return { error: 'Забагато запитів. Зачекайте хвилину.' };
  }

  // Idempotent cancellation: deleteMany won't throw even if record was already deleted
  await prisma.attendance.deleteMany({
    where: {
      eventId,
      userId: user.id,
    },
  });

  revalidatePath(`/events/${eventId}`);
  if (token) revalidatePath(`/e/${token}`);
  revalidatePath('/profile');

  return { message: 'Запис успішно скасовано' };
}
