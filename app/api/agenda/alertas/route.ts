import { getCupoPorFranja, getFranjas } from "@/lib/config";
import { hoyBogota } from "@/lib/fechas";
import { esAprobada, todasLasCitas } from "@/lib/sheets";

export const dynamic = "force-dynamic";

/**
 * Alertas de cupos de cualquier día (hoy en adelante): franjas a las que les
 * queda 1 cupo o ninguno. No depende de la fecha seleccionada en la agenda.
 */
export async function GET() {
  try {
    const citas = await todasLasCitas();
    const cupo = getCupoPorFranja();
    const franjas = new Set(getFranjas());
    const hoy = hoyBogota();

    // Conteo de citas por fecha y hora.
    const ocupadas = new Map<string, { fecha: string; franja: string; n: number }>();
    for (const c of citas) {
      // Solo las citas aprobadas ocupan cupo; las rechazadas no.
      if (!esAprobada(c) || c.fecha < hoy || !franjas.has(c.hora)) continue;
      const clave = `${c.fecha} ${c.hora}`;
      const actual = ocupadas.get(clave) ?? { fecha: c.fecha, franja: c.hora, n: 0 };
      actual.n += 1;
      ocupadas.set(clave, actual);
    }

    const alertas = [...ocupadas.values()]
      .map((o) => ({ fecha: o.fecha, franja: o.franja, ocupadas: o.n, cupo, libres: Math.max(cupo - o.n, 0) }))
      .filter((a) => a.libres <= 1)
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
