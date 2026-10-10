import { VistaAgenda } from "@/components/VistaAgenda";
import { hoyBogota } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default function AgendaPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Agenda</h1>
      <VistaAgenda hoy={hoyBogota()} />
    </div>
  );
}
