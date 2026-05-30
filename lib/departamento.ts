const MAPA: Record<string, string> = {
  '12': 'Humanidades',
  '13': 'Ciencias Sociales',
  '14': 'Administración',
  '15': 'Economía',
  '16': 'Ingeniería',
  '17': 'Derecho',
  '18': 'Comunicaciones',
  '27': 'General',
  '38': 'Matemáticas',
};

export function departamentoDesdeCodigo(codigo: string): string {
  const prefijo = codigo.slice(0, 2);
  return MAPA[prefijo] ?? `Depto. ${prefijo}`;
}
