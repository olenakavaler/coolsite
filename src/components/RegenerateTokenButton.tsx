'use client';

import { useTransition } from 'react';
import { regenerateToken } from '@/app/actions/events';
import { useToast } from '@/app/providers';
import { RefreshCw } from 'lucide-react';

export function RegenerateTokenButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleRegenerate = () => {
    if (
      !confirm(
        'Ви впевнені, що хочете перегенерувати посилання? Старе посилання негайно стане недійсним.',
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await regenerateToken(eventId);
      if (res?.error) {
        addToast(res.error, 'error');
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRegenerate}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Генерація...' : 'Перегенерувати'}
    </button>
  );
}
