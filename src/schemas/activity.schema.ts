import { z } from 'zod';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const activitySchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio').max(180),
    description: z.string().optional(),
    activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    timeDefined: z.boolean(),
    startTime: z.string().optional(),
    status: z.enum(['PLANNED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
    observations: z.string().optional(),
    placeId: z.string().uuid('Selecciona un lugar'),
    organizationId: z.string().uuid('Selecciona una organización'),
    neighborhoodId: z.string().uuid('Selecciona un barrio'),
  })
  .superRefine((data, ctx) => {
    if (data.timeDefined) {
      if (!data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startTime'],
          message: 'La hora es obligatoria',
        });
      } else if (!HHMM.test(data.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startTime'],
          message: 'Formato HH:mm',
        });
      }
    }
    const year = Number(data.activityDate.slice(0, 4));
    if (year !== 2027) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activityDate'],
        message: 'Solo actividades del año 2027',
      });
    }
  });

export type ActivityFormData = z.infer<typeof activitySchema>;