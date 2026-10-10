import { FormularioCita } from "@/components/FormularioCita";
import { getFranjas } from "@/lib/config";
import { hoyBogota } from "@/lib/fechas";

// Las franjas vienen de variables de entorno: se leen en cada petición.
export const dynamic = "force-dynamic";

export default function AgendarPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agendar cita</h1>
        <p className="mt-2 text-slate-600">
          Completa los datos del propietario y de la mascota, y elige el día y la franja que prefieras.
        </p>
      </div>
      <FormularioCita franjas={getFranjas()} hoy={hoyBogota()} />
    </div>
  );
}
