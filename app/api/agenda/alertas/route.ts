import { hoyBogota } from "@/lib/fechas";
import { cuposPorFranja } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * Alertas de cupos de cualquier día (hoy en adelante): franjas a las que les
 * queda 1 cupo o ninguno, según la pestaña de cupos que mantiene Make
 * (cupo - ocupados). No depende de la fecha seleccionada en la agenda.
 */
export async function GET() {
  try {
    const hoy = hoyBogota();
    const alertas = (await cuposPorFranja())
      .filter((c) => c.fecha >= hoy && c.libres <= 1)
      .map((c) => ({
        fecha: c.fecha,
        franja: c.franja,
        ocupadas: c.ocupados,
        cupo: c.cupo,
        libres: c.libres,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.franja.localeCompare(b.franja));

    return Response.json({ ok: true, alertas });
  } catch (e) {
    console.error("[alertas]", e instanceof Error ? e.message : "error inesperado");
    return Response.json(
      { ok: false, error: "No se pudieron cargar las notificaciones." },
      { status: 502 },
    );
  }
}
