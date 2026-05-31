import { z } from 'zod';

export function parsePreguntasMarcadas(values: FormDataEntryValue[]): number[] {
  const nums = values
    .map((v) => (typeof v === 'string' ? Number(v) : NaN))
    .filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(nums)].sort((a, b) => a - b);
}

export const crearReclamoEstudianteSchema = z.object({
  evaluacionId: z.string().min(1),
  motivo: z.enum(['error_suma', 'revision_integral', 'otro']),
  argumento: z.string().min(10, 'El argumento debe tener al menos 10 caracteres'),
  examenNoLapiz: z
    .string()
    .transform((v) => v === 'true' || v === 'on')
    .pipe(z.literal(true, { message: 'Debe confirmar que el examen no fue hecho con lápiz' })),
});

export const resolverReclamoSchema = z
  .object({
    reclamoId: z.string().min(1),
    resultadoFinal: z.enum(['no_procede', 'procede_modifica', 'procede_sin_modifica']),
    notaNueva: z.preprocess(
      (val) => (val === null || val === '' ? undefined : val),
      z.coerce.number().min(0).max(20).optional()
    ),
    comentario: z.preprocess(
      (val) => (val === null || val === '' ? undefined : val),
      z.string().optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.resultadoFinal === 'procede_modifica') {
      if (data.notaNueva == null || Number.isNaN(data.notaNueva)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Indique la nota nueva si procede y modifica',
          path: ['notaNueva'],
        });
      }
      return;
    }
    const texto = data.comentario?.trim() ?? '';
    if (texto.length < 5) {
      ctx.addIssue({
        code: 'custom',
        message: 'Comentario requerido (mín. 5 caracteres)',
        path: ['comentario'],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
