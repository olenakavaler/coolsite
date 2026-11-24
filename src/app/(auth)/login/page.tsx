'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFormState } from 'react-dom';
import { login } from '@/app/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/validation';

function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || undefined;
  const [state, formAction] = useFormState<ActionState, FormData>(login, null);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Вхід
      </h1>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        {state?.error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            role="alert"
          >
            {state.error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {state?.fieldErrors?.email && (
            <p className="text-red-500 text-sm mt-1">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {state?.fieldErrors?.password && (
            <p className="text-red-500 text-sm mt-1">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <SubmitButton
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          loadingText="Вхід..."
        >
          Увійти
        </SubmitButton>
      </form>

      <p className="text-center text-gray-600 mt-6 text-sm">
        Немає акаунту?{' '}
        <Link
          href="/register"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Зареєструватися
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
