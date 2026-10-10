"use client";

import { useEffect, useRef } from "react";

export type Estado = "confirmada" | "con_alerta" | "rechazada";

export type Resultado =
  | { tipo: "exito"; estado: Estado; mensaje: string }
  | { tipo: "error"; mensaje: string };

const MENSAJE_RECHAZADA = "Para esa franja no se puede agendar una cita, elige otra franja.";

const TITULOS: Record<Estado, string> = {
  confirmada: "Cita confirmada",
  con_alerta: "Cita agendada con alerta",
  rechazada: "Franja no disponible",
};

const ESTILOS: Record<Estado | "error", { icono: string; caja: string; boton: string }> = {
  confirmada: { icono: "✓", caja: "bg-green-100 text-green-700", boton: "bg-green-700 hover:bg-green-800" },
  con_alerta: { icono: "!", caja: "bg-amber-100 text-amber-700", boton: "bg-amber-600 hover:bg-amber-700" },
  rechazada: { icono: "✕", caja: "bg-red-100 text-red-700", boton: "bg-red-700 hover:bg-red-800" },
  error: { icono: "✕", caja: "bg-red-100 text-red-700", boton: "bg-red-700 hover:bg-red-800" },
};

export function ModalResultado({
  resultado,
  onCerrar,
}: {
  resultado: Resultado | null;
  onCerrar: () => void;
}) {
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!resultado) return;
    boton.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [resultado, onCerrar]);

  if (!resultado) return null;

  const clave = resultado.tipo === "error" ? "error" : resultado.estado;
  const estilo = ESTILOS[clave];
  const rechazada = resultado.tipo === "exito" && resultado.estado === "rechazada";
  const titulo = resultado.tipo === "error" ? "No se pudo agendar la cita" : TITULOS[resultado.estado];
  const mensaje =
    resultado.tipo === "error" ? resultado.mensaje : rechazada ? MENSAJE_RECHAZADA : resultado.mensaje;
  const textoBoton =
    resultado.tipo === "error" ? "Reintentar" : rechazada ? "Elegir otra franja" : "Aceptar";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCerrar}
    >
      <div
        role={resultado.tipo === "error" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby="modal-mensaje"
        className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${estilo.caja}`}
          aria-hidden="true"
        >
          {estilo.icono}
        </div>
        <h2 id="modal-titulo" className="text-lg font-semibold">
          {titulo}
        </h2>
        <p id="modal-mensaje" className="mt-2 text-sm text-slate-600">
          {mensaje}
        </p>

        <button
          ref={boton}
          type="button"
          onClick={onCerrar}
          className={`mt-6 w-full rounded-md px-4 py-2 text-sm font-medium text-white ${estilo.boton}`}
        >
          {textoBoton}
        </button>
      </div>
    </div>
  );
}
