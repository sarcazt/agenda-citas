import { z } from "zod";
import { esFechaValida } from "./fechas";

export const ESTADOS = ["confirmada", "con_alerta", "rechazada"] as const;
export type Estado = (typeof ESTADOS)[number];

/** Lo que envía el formulario a /api/agendar (y la app a Make). */
export const citaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  correo: z.string().trim().min(1, "El correo es obligatorio").email("Correo no válido").max(200),
  fecha: z.string().refine(esFechaValida, "Fecha no válida"),
  franja: z.string().regex(/^\d{2}:\d{2}$/, "Selecciona una franja"),
  observaciones: z.string().trim().max(500).default(""),
});
export type Cita = z.infer<typeof citaSchema>;

/** Lo que debe responder Make. */
export const respuestaMakeSchema = z.object({
  estado: z.enum(ESTADOS),
  mensaje: z.string(),
  cupos_libres: z.coerce.number().int().min(0),
});
export type RespuestaMake = z.infer<typeof respuestaMakeSchema>;
