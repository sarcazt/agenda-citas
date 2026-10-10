import Link from "next/link";

const SECCIONES = [
  {
    href: "/agendar",
    icono: "🐶",
    etiqueta: "Portal del cliente",
    audiencia: "Para el propietario de la mascota",
    texto: "Agenda una cita eligiendo el día y la franja que prefieras, y recibe la confirmación al instante.",
    accion: "Agendar una cita",
    caja: "border-teal-200 hover:border-teal-400",
    chip: "bg-teal-600",
    badge: "bg-teal-100 text-teal-800",
    boton: "text-teal-700",
  },
  {
    href: "/agenda",
    icono: "🗂️",
    etiqueta: "Panel de recepción",
    audiencia: "Uso interno del personal",
    texto: "Consulta las citas programadas de cada día, con la hora, el propietario, la mascota y el servicio.",
    accion: "Ver la agenda",
    caja: "border-indigo-200 hover:border-indigo-400",
    chip: "bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-800",
    boton: "text-indigo-700",
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agenda de citas</h1>
        <p className="mt-2 text-slate-600">Elige la sección que corresponde a tu rol.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${s.caja}`}
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm ${s.chip}`}
              aria-hidden="true"
            >
              {s.icono}
            </span>
            <span
              className={`mt-5 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${s.badge}`}
            >
              {s.etiqueta}
            </span>
            <h2 className="mt-2 text-lg font-semibold">{s.audiencia}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{s.texto}</p>
            <span className={`mt-5 text-sm font-semibold ${s.boton}`}>
              {s.accion} <span className="inline-block transition group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
