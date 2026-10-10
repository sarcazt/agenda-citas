const ESTILOS = {
  teal: {
    caja: "border-teal-200 bg-teal-50",
    icono: "bg-teal-600",
    etiqueta: "bg-teal-600 text-white",
    texto: "text-teal-900",
  },
  indigo: {
    caja: "border-indigo-200 bg-indigo-50",
    icono: "bg-indigo-600",
    etiqueta: "bg-indigo-600 text-white",
    texto: "text-indigo-900",
  },
} as const;

export function BannerSeccion({
  color,
  icono,
  etiqueta,
  audiencia,
  descripcion,
}: {
  color: keyof typeof ESTILOS;
  icono: string;
  etiqueta: string;
  audiencia: string;
  descripcion: string;
}) {
  const e = ESTILOS[color];
  return (
    <div className={`mb-8 flex items-center gap-4 rounded-2xl border px-5 py-4 ${e.caja}`}>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm ${e.icono}`}
        aria-hidden="true"
      >
        {icono}
      </span>
      <div className={e.texto}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${e.etiqueta}`}>
            {etiqueta}
          </span>
          <span className="text-sm font-semibold">{audiencia}</span>
        </div>
        <p className="mt-1 text-sm opacity-80">{descripcion}</p>
      </div>
    </div>
  );
}
