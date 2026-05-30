import { z } from 'zod';

export const crearReclamoEstudianteSchema = z.object({
  evaluacionId: z.string().min(1),
  motivo: z.enum(['error_suma', 'revision_integral', 'otro']),
  argumento: z.string().min(10, 'El argumento debe tener al menos 10 caracteres'),
  preguntaMarcada: z.coerce.number().int().positive().optional(),
  examenNoLapiz: z
    .string()
    .transform((v) => v === 'true' || v === 'on')
    .pipe(z.literal(true, { message: 'Debe confirmar que el examen no fue hecho con lápiz' })),
  representantePresenciado: z
    .string()
    .transform((v) => v === 'true' || v === 'on')
    .pipe(
      z.literal(true, {
        message: 'Debe confirmar que el representante de aula presenció el escaneo',
      })
    ),
});

export const resolverReclamoSchema = z.object({
  reclamoId: z.string().min(1),
  resultadoFinal: z.enum(['no_procede', 'procede_modifica', 'procede_sin_modifica']),
  notaNueva: z.coerce.number().min(0).max(20).optional(),
  comentario: z.string().min(5, 'Comentario requerido'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
