'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
  getDummyHash,
} from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/validation';
import type { ActionState } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { safeRedirect, getClientIp } from '@/lib/utils';

export async function register(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const ipLimit = rateLimit(`register:ip:${ip}`, 5, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return { error: 'Забагато спроб реєстрації. Спробуйте через 15 хвилин.' };
  }

  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { fieldErrors };
  }

  const { email, name, password } = parsed.data;

  const emailLimit = rateLimit(`register:email:${email}`, 3, 15 * 60 * 1000);
  if (!emailLimit.success) {
    return { error: 'Забагато спроб реєстрації для цього email.' };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: 'Користувач з таким email вже існує' };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  await createSession(user.id);

  const next = formData.get('next') as string | null;
  redirect(safeRedirect(next));
}

export async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const ipLimit = rateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return { error: 'Забагато спроб входу. Спробуйте через 15 хвилин.' };
  }

  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    // Generic message to prevent email enumeration
    return { error: 'Невірний email або пароль' };
  }

  const { email, password } = parsed.data;

  const emailLimit = rateLimit(`login:email:${email}`, 5, 15 * 60 * 1000);
  if (!emailLimit.success) {
    return { error: 'Забагато спроб входу. Спробуйте через 15 хвилин.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt comparison for constant-time behavior (prevents timing-based enumeration)
  const hashToCompare = user?.passwordHash ?? (await getDummyHash());
  const valid = await verifyPassword(password, hashToCompare);

  if (!user || !valid) {
    return { error: 'Невірний email або пароль' };
  }

  await createSession(user.id);

  const next = formData.get('next') as string | null;
  redirect(safeRedirect(next));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/');
}
