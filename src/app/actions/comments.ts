'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { requireUser, canViewEvent } from '@/lib/access';
import { commentSchema, type ActionState } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/utils';

export async function addComment(
  eventId: string,
  token: string | null | undefined,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return { error: 'Необхідно увійти в систему' };
  }

  const headersList = await headers();
  const ip = getClientIp(headersList);
  const limit = rateLimit(`comment:${user.id}:${ip}`, 10, 60 * 1000);
  if (!limit.success) {
    return { error: 'Забагато коментарів. Зачекайте хвилину.' };
  }

  // Verify access: On private events, only people with access can comment
  const event = await canViewEvent(eventId, token);
  if (!event) {
    return { error: 'Подію не знайдено або доступ заборонено' };
  }

  const rawData = {
    content: formData.get('content'),
  };

  const parsed = commentSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Невалідний коментар' };
  }

  await prisma.comment.create({
    data: {
      content: parsed.data.content,
      eventId,
      userId: user.id,
    },
  });

  revalidatePath(`/events/${eventId}`);
  if (token) revalidatePath(`/e/${token}`);

  return { message: 'Коментар додано' };
}

export async function deleteComment(
  commentId: string,
  eventId: string,
  token?: string | null,
): Promise<ActionState> {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return { error: 'Необхідно увійти в систему' };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { event: { select: { ownerId: true } } },
  });

  if (!comment) {
    return { error: 'Коментар не знайдено' };
  }

  // Rule: Delete allowed by comment author OR event author
  const isCommentAuthor = comment.userId === user.id;
  const isEventAuthor = comment.event.ownerId === user.id;

  if (!isCommentAuthor && !isEventAuthor) {
    return { error: 'Доступ заборонено: видалити коментар може лише його автор або автор події' };
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/events/${eventId}`);
  if (token) revalidatePath(`/e/${token}`);

  return { message: 'Коментар видалено' };
}
