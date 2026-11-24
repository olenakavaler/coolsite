'use client';

import { useTransition } from 'react';
import { deleteEvent } from '@/app/actions/events';
import { useToast } from '@/app/providers';
import { Trash2 } from 'lucide-react';

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleDelete = () => {
    if (
      !confirm(
        'Ви впевнені, що хочете видалити цю подію? Це безповоротно видалить всі записи та коментарі.',
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteEvent(eventId);
      if (res?.error) {
        addToast(res.error, 'error');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? 'Видалення...' : 'Видалити подію'}
    </button>
  );
}
