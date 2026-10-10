import { VistaAgenda } from "@/components/VistaAgenda";
import { hoyBogota } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default function AgendaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
        <p className="mt-2 text-slate-600">Consulta las citas programadas para cada día.</p>
      </div>
      <VistaAgenda hoy={hoyBogota()} />
    </div>
  );
}
