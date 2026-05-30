/** Normaliza texto para correo institucional UP (sin tildes, minúsculas). */
export function normalizarParaEmail(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export type PartesNombre = {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
};

/** Formato UP: [inicial nombre][apellido paterno][inicial apellido materno]@dominio */
export function generarEmailUp(
  partes: PartesNombre,
  dominio: 'up.edu.pe' | 'alum.up.edu.pe'
): string {
  const inicialNombre = normalizarParaEmail(partes.nombres)[0] ?? 'x';
  const apellidoP = normalizarParaEmail(partes.apellidoPaterno);
  const inicialApM =
    normalizarParaEmail(partes.apellidoMaterno)[0] ??
    apellidoP[apellidoP.length - 1] ??
    'x';
  return `${inicialNombre}${apellidoP}${inicialApM}@${dominio}`;
}

/** Profesor del PDF: "APELLIDO PATERN, Nombre" */
export function parseNombreProfesor(raw: string): PartesNombre {
  const limpio = raw.trim();
  if (limpio.includes(',')) {
    const [apellidos, nombresRaw] = limpio.split(',').map((s) => s.trim());
    const apParts = apellidos.split(/\s+/).filter(Boolean);
    return {
      nombres: nombresRaw,
      apellidoPaterno: apParts[0] ?? apellidos,
      apellidoMaterno: apParts[1] ?? apParts[0] ?? 'Up',
    };
  }
  const parts = limpio.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return {
      nombres: parts[0],
      apellidoPaterno: parts[1],
      apellidoMaterno: parts[2],
    };
  }
  if (parts.length === 2) {
    return {
      nombres: parts[0],
      apellidoPaterno: parts[1],
      apellidoMaterno: parts[1],
    };
  }
  return { nombres: parts[0] ?? 'Docente', apellidoPaterno: 'Up', apellidoMaterno: 'Up' };
}

/** Estudiante: "Nombre ApellidoP ApellidoM" */
export function parseNombreEstudiante(raw: string): PartesNombre {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return {
      nombres: parts[0],
      apellidoPaterno: parts[1],
      apellidoMaterno: parts.slice(2).join(' '),
    };
  }
  if (parts.length === 2) {
    return {
      nombres: parts[0],
      apellidoPaterno: parts[1],
      apellidoMaterno: parts[1],
    };
  }
  return { nombres: parts[0] ?? 'Estudiante', apellidoPaterno: 'Up', apellidoMaterno: 'Up' };
}

export function nombreCompleto(partes: PartesNombre): string {
  return `${partes.nombres} ${partes.apellidoPaterno} ${partes.apellidoMaterno}`.trim();
}

export function emailDocenteUp(partes: PartesNombre): string {
  return generarEmailUp(partes, 'up.edu.pe');
}

export function emailAlumnoUp(partes: PartesNombre): string {
  return generarEmailUp(partes, 'alum.up.edu.pe');
}

export function emailUnico(
  base: string,
  usados: Set<string>,
  sufijo = 1
): string {
  let email = base;
  while (usados.has(email)) {
    const [local, domain] = base.split('@');
    email = `${local}${sufijo}@${domain}`;
    sufijo++;
  }
  usados.add(email);
  return email;
}
