import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(180),
  description: z.string().optional(),
  contactName: z.string().max(180).optional(),
  contactPhone: z.string().max(30).optional(),
});
export type OrganizationFormData = z.infer<typeof organizationSchema>;

export const neighborhoodSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(180),
  description: z.string().optional(),
  reference: z.string().optional(),
});
export type NeighborhoodFormData = z.infer<typeof neighborhoodSchema>;

export const placeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(180),
  address: z.string().min(1, "La dirección es obligatoria").max(255),
  reference: z.string().optional(),
  description: z.string().optional(),
});
export type PlaceFormData = z.infer<typeof placeSchema>;
