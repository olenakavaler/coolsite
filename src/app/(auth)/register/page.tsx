'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFormState } from 'react-dom';
import { register } from '@/app/actions/auth';
import { SubmitButton } from '@/components/SubmitButton';
import type { ActionState } from '@/lib/validation';

function RegisterContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || undefined;
  const [state, formAction] = useFormState<ActionState, FormData>(
    register,
    null,
  );

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Реєстрація
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
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ім&apos;я
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {state?.fieldErrors?.name && (
            <p className="text-red-500 text-sm mt-1">
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-gray-500 text-xs mt-1">Мінімум 8 символів</p>
          {state?.fieldErrors?.password && (
            <p className="text-red-500 text-sm mt-1">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <SubmitButton
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          loadingText="Реєстрація..."
        >
          Зареєструватися
        </SubmitButton>
      </form>

      <p className="text-center text-gray-600 mt-6 text-sm">
        Вже маєте акаунт?{' '}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Увійти
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
