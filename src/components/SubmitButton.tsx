'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({
  children,
  loadingText = 'Завантаження...',
  className = '',
}: {
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${className}`}
    >
      {pending ? loadingText : children}
    </button>
  );
}
