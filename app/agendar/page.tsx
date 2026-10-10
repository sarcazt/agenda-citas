import { FormularioCita } from "@/components/FormularioCita";
import { getFranjas } from "@/lib/config";
import { hoyBogota } from "@/lib/fechas";

// Las franjas vienen de variables de entorno: se leen en cada petición.
export const dynamic = "force-dynamic";

export default function AgendarPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Agendar cita</h1>
      <FormularioCita franjas={getFranjas()} hoy={hoyBogota()} />
    </div>
  );
}
