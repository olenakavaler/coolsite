import { randomBytes } from 'crypto';
import { prisma } from './db';
import { deleteUpload } from './upload';

export function generateCryptoToken(): string {
  // 128-bit cryptographically secure random token (32 hex characters)
  return randomBytes(16).toString('hex');
}

export async function deleteEventCascade(eventId: string) {
  // Fetch event to get cover image path before deletion
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { coverImage: true },
  });

  if (event?.coverImage) {
    const filename = event.coverImage.replace(/^\/uploads\//, '');
    await deleteUpload(filename);
  }

  // Deletion cascades to attendances and comments via Prisma foreign key relation
  return prisma.event.delete({
    where: { id: eventId },
  });
}
