import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getCodigoUser, getNombreUser } from '@/lib/user-profile';
import type { SessionUser, Rol } from '@/lib/types';

const SESSION_COOKIE = 'reclamoup_session';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no configurado');
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    codigo: user.codigo,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as Rol,
      codigo: (payload.codigo as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error('No autenticado');
  return session;
}

export async function requireRol(...roles: Rol[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.rol)) throw new Error('No autorizado');
  return session;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { alumno: true, docente: true, administrativoDaar: true },
  });
  if (!user) return null;

  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    nombre: getNombreUser(user),
    rol: user.rol as Rol,
    codigo: getCodigoUser(user),
  } satisfies SessionUser;
}

export function getDashboardPath(rol: Rol): string {
  switch (rol) {
    case 'estudiante':
      return '/estudiante';
    case 'docente':
      return '/docente';
    case 'daar':
      return '/daar/dashboard';
    default:
      return '/login';
  }
}
