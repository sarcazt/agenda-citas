const FRANJAS_POR_DEFECTO = "08:00,09:00,10:00,11:00,14:00,15:00,16:00";

/** Cupo máximo de citas por franja (CUPO_POR_FRANJA, por defecto 3). */
export function getCupoPorFranja(): number {
  const n = Number.parseInt(process.env.CUPO_POR_FRANJA ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

/** Se lee en cada llamada para tomar las variables en tiempo de ejecución. */
export function getFranjas(): string[] {
  return (process.env.FRANJAS ?? FRANJAS_POR_DEFECTO)
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}
