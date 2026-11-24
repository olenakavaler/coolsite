import { prisma } from './db';
import { getCurrentUser } from './auth';

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function canViewEvent(eventId: string, token?: string | null) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { attendances: true } },
    },
  });

  if (!event) return null;

  // Public events are visible to everyone
  if (event.visibility === 'PUBLIC') return event;

  // Private event checks
  const user = await getCurrentUser();

  // Owner can always see their own event
  if (user && user.id === event.ownerId) return event;

  // Valid token gives access
  if (token && event.token === token) return event;

  // Registered user can see their private event in profile/link
  if (user) {
    const attendance = await prisma.attendance.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } },
    });
    if (attendance) return event;
  }

  // Without token and not owner/attendee: return 404 (never 403 to avoid leaking existence)
  return null;
}

export async function findEventByToken(token: string) {
  if (!token || typeof token !== 'string') return null;
  return prisma.event.findUnique({
    where: { token },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { attendances: true } },
    },
  });
}

export async function requireEventOwner(eventId: string) {
  const user = await requireUser();
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: { select: { attendances: true } },
    },
  });

  if (!event) {
    return null;
  }

  if (event.ownerId !== user.id) {
    throw new Error('FORBIDDEN');
  }

  return { event, user };
}
