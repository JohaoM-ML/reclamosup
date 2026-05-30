import { jwtVerify } from 'jose';
import type { Rol } from '@/lib/types';

const SESSION_COOKIE = 'reclamoup_session';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET no configurado');
  return new TextEncoder().encode(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as Rol,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
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
