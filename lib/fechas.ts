const ZONA = "America/Bogota";

/** Fecha de hoy en Bogotá como YYYY-MM-DD, sin pasar por UTC. */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Fecha y hora actuales en Bogotá con segundos: "AAAA-MM-DD HH:mm:ss". */
export function ahoraBogota(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

/** Verifica que el texto sea una fecha real con formato YYYY-MM-DD. */
export function esFechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}
