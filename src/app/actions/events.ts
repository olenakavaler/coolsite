'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireUser, requireEventOwner } from '@/lib/access';
import { createEventSchema, updateEventSchema, type ActionState } from '@/lib/validation';
import { saveUpload, deleteUpload } from '@/lib/upload';
import { generateCryptoToken, deleteEventCascade } from '@/lib/events';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/utils';

export async function createEvent(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return { error: 'Необхідно увійти в систему' };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = rateLimit(`event-create:${user.id}:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.success) {
    return { error: 'Забагато створених подій. Спробуйте пізніше.' };
  }

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    startsAt: formData.get('startsAt'),
    capacity: formData.get('capacity'),
    visibility: formData.get('visibility'),
  };

  const parsed = createEventSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { fieldErrors };
  }

  const { title, description, startsAt, capacity, visibility } = parsed.data;

  // Handle cover image upload if provided
  let coverImage: string | null = null;
  const imageFile = formData.get('coverImage') as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      const filename = await saveUpload(imageFile);
      coverImage = `/uploads/${filename}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження файлу';
      return { error: msg };
    }
  }

  const token = visibility === 'PRIVATE' ? generateCryptoToken() : null;

  const event = await prisma.event.create({
    data: {
      title,
      description,
      startsAt: new Date(startsAt),
      capacity,
      visibility,
      token,
      coverImage,
      ownerId: user.id,
    },
  });

  revalidatePath('/');
  if (visibility === 'PRIVATE') {
    redirect(`/e/${token}`);
  } else {
    redirect(`/events/${event.id}`);
  }
}

export async function updateEvent(
  eventId: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let ownerCheck;
  try {
    ownerCheck = await requireEventOwner(eventId);
  } catch {
    return { error: 'Доступ заборонено' };
  }

  if (!ownerCheck) {
    return { error: 'Подію не знайдено' };
  }

  const { event } = ownerCheck;

  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    startsAt: formData.get('startsAt'),
    capacity: formData.get('capacity'),
    visibility: formData.get('visibility'),
  };

  const parsed = updateEventSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { fieldErrors };
  }

  const { title, description, startsAt, capacity, visibility } = parsed.data;

  // Rule: capacity cannot be decreased below current attendee count
  if (capacity !== undefined && capacity < event._count.attendances) {
    return {
      error: `Кількість місць (${capacity}) не може бути меншою за поточну кількість учасників (${event._count.attendances})`,
    };
  }

  // Handle cover image replacement if provided
  let newCoverImage = event.coverImage;
  const imageFile = formData.get('coverImage') as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      const filename = await saveUpload(imageFile);
      if (event.coverImage) {
        await deleteUpload(event.coverImage.replace(/^\/uploads\//, ''));
      }
      newCoverImage = `/uploads/${filename}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка завантаження файлу';
      return { error: msg };
    }
  }

  // If changing from PUBLIC to PRIVATE and has no token, generate one
  let token = event.token;
  if (visibility === 'PRIVATE' && !token) {
    token = generateCryptoToken();
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
      ...(capacity !== undefined && { capacity }),
      ...(visibility !== undefined && { visibility }),
      ...(token !== undefined && { token }),
      coverImage: newCoverImage,
    },
  });

  revalidatePath('/');
  revalidatePath(`/events/${eventId}`);
  if (token) revalidatePath(`/e/${token}`);

  if (visibility === 'PRIVATE' && token) {
    redirect(`/e/${token}`);
  } else {
    redirect(`/events/${eventId}`);
  }
}

export async function deleteEvent(eventId: string): Promise<ActionState> {
  try {
    const ownerCheck = await requireEventOwner(eventId);
    if (!ownerCheck) {
      return { error: 'Подію не знайдено' };
    }
  } catch {
    return { error: 'Доступ заборонено' };
  }

  await deleteEventCascade(eventId);
  revalidatePath('/');
  revalidatePath('/profile');
  redirect('/profile');
}

export async function regenerateToken(eventId: string): Promise<ActionState> {
  let ownerCheck;
  try {
    ownerCheck = await requireEventOwner(eventId);
  } catch {
    return { error: 'Доступ заборонено' };
  }

  if (!ownerCheck) {
    return { error: 'Подію не знайдено' };
  }

  const { event } = ownerCheck;
  if (event.visibility !== 'PRIVATE') {
    return { error: 'Токен можна згенерувати лише для приватної події' };
  }

  const newToken = generateCryptoToken();
  await prisma.event.update({
    where: { id: eventId },
    data: { token: newToken },
  });

  if (event.token) {
    revalidatePath(`/e/${event.token}`);
  }
  revalidatePath(`/e/${newToken}`);
  redirect(`/e/${newToken}`);
}
