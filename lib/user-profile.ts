import { nombreCompleto, type PartesNombre } from '@/lib/email-up';

type PerfilAlumno = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  codigo: string;
};

type PerfilDocente = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
};

type PerfilDaar = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
};

export type UserConPerfil = {
  id: string;
  email: string;
  rol: string;
  alumno?: PerfilAlumno | null;
  docente?: PerfilDocente | null;
  administrativoDaar?: PerfilDaar | null;
};

export function partesDesdeUser(user: UserConPerfil): PartesNombre | null {
  const p = user.alumno ?? user.docente ?? user.administrativoDaar;
  if (!p) return null;
  return {
    nombres: p.nombres,
    apellidoPaterno: p.apellidoPaterno,
    apellidoMaterno: p.apellidoMaterno,
  };
}

export function getNombreUser(user: UserConPerfil): string {
  const partes = partesDesdeUser(user);
  return partes ? nombreCompleto(partes) : user.email;
}

export function getCodigoUser(user: UserConPerfil): string | null {
  return user.alumno?.codigo ?? null;
}

export const userProfileInclude = {
  alumno: true,
  docente: true,
  administrativoDaar: true,
} as const;

export const userDisplaySelect = {
  id: true,
  email: true,
  rol: true,
  alumno: {
    select: {
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
      codigo: true,
    },
  },
  docente: {
    select: {
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
    },
  },
  administrativoDaar: {
    select: {
      nombres: true,
      apellidoPaterno: true,
      apellidoMaterno: true,
    },
  },
} as const;
