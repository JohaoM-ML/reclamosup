/** Código UP: prefijo 000 + 6 dígitos (ej. 000482917) */
export const CODIGO_UP_REGEX = /^000\d{6}$/;

export function generarCodigoUpAleatorio(): string {
  const seis = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `000${seis}`;
}

export function esCodigoUpValido(codigo: string | null | undefined): boolean {
  return codigo != null && CODIGO_UP_REGEX.test(codigo);
}

export function generarCodigosUpUnicos(cantidad: number): string[] {
  const set = new Set<string>();
  while (set.size < cantidad) {
    set.add(generarCodigoUpAleatorio());
  }
  return [...set];
}
