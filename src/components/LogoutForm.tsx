'use client';

import { useFormStatus } from 'react-dom';
import { logout } from '@/app/actions/auth';

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
    >
      {pending ? '...' : 'Вийти'}
    </button>
  );
}

export function LogoutForm() {
  return (
    <form action={logout}>
      <Button />
    </form>
  );
}
