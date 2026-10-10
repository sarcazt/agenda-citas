import { hoyBogota } from "./fechas";
import type { CitaAgenda } from "./sheets";

// Solo para MAKE_MOCK=true: reemplaza a la hoja de Google Sheets.
// Se guarda en globalThis porque cada ruta puede cargar su propia copia del módulo.
const g = globalThis as { __citasMock?: CitaAgenda[] };

function store(): CitaAgenda[] {
  if (!g.__citasMock) {
    const hoy = hoyBogota();
    g.__citasMock = [
      { id: "demo-1", fecha: hoy, franja: "08:00", nombre: "Carlos Pérez", estado: "confirmada" },
      { id: "demo-2", fecha: hoy, franja: "09:00", nombre: "María López", estado: "con_alerta" },
      { id: "demo-3", fecha: hoy, franja: "11:00", nombre: "Juan Gómez", estado: "rechazada" },
    ];
  }
  return g.__citasMock;
}

export function guardarMock(cita: Omit<CitaAgenda, "id">): void {
  store().push({ id: crypto.randomUUID(), ...cita });
}

export function citasMockPorFecha(fecha: string): CitaAgenda[] {
  return store()
    .filter((c) => c.fecha === fecha)
    .sort((a, b) => a.franja.localeCompare(b.franja));
}
