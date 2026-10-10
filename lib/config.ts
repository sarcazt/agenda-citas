const FRANJAS_POR_DEFECTO = "08:00,09:00,10:00,11:00,14:00,15:00,16:00";

/** Se lee en cada llamada para tomar las variables en tiempo de ejecución. */
export function getFranjas(): string[] {
  return (process.env.FRANJAS ?? FRANJAS_POR_DEFECTO)
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

export function isMock(): boolean {
  return process.env.MAKE_MOCK === "true";
}
