import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { EditEventForm } from './EditEventForm';

export const dynamic = 'force-dynamic';

interface EditEventPageProps {
  params: {
    id: string;
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/events/${id}/edit`);
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: { select: { attendances: true } },
    },
  });

  if (!event) {
    notFound();
  }

  // IDOR protection: only owner can access edit page
  if (event.ownerId !== user.id) {
    redirect(`/events/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
      <EditEventForm
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          startsAt: event.startsAt,
          capacity: event.capacity,
          visibility: event.visibility,
          coverImage: event.coverImage,
          attendeesCount: event._count.attendances,
        }}
      />
    </div>
  );
}
