import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { prisma } from './db';

const SESSION_COOKIE = 'session_token';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  // Session rotation: invalidate all existing sessions for user
  await prisma.session.deleteMany({ where: { userId } });

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    path: '/',
  });
}

export async function getSession() {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    return null;
  }
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

// Pre-computed dummy hash for timing-safe comparison (prevents user enumeration)
let _dummyHash: string | undefined;
export async function getDummyHash(): Promise<string> {
  if (!_dummyHash) {
    _dummyHash = await hashPassword('timing-safe-dummy-value');
  }
  return _dummyHash;
}
