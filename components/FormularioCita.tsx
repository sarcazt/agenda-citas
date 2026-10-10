"use client";

import { useCallback, useState } from "react";
import { ModalResultado, type Resultado } from "./ModalResultado";

// Datos de prueba para llenar el formulario con un clic. `hora` es un índice
// dentro de las franjas configuradas, así siempre queda una franja válida.
const PRUEBAS = [
  {
    etiqueta: "María López · Luna (Gato) · Consulta general",
    propietario: "María López",
    correo: "maria@example.com",
    telefono: "3187141190",
    mascota: "Luna",
    especie: "Gato",
    servicio: "Consulta general",
    hora: 2,
  },
  {
    etiqueta: "Carlos Pérez · Rocky (Perro) · Vacunación",
    propietario: "Carlos Pérez",
    correo: "carlos@example.com",
    telefono: "3187141190",
    mascota: "Rocky",
    especie: "Perro",
    servicio: "Vacunación",
    hora: 0,
  },
  {
    etiqueta: "Ana Gómez · Kiwi (Ave) · Control",
    propietario: "Ana Gómez",
    correo: "ana@example.com",
    telefono: "3187141190",
    mascota: "Kiwi",
    especie: "Ave",
    servicio: "Control",
    hora: 4,
  },
  {
    etiqueta: "Juan Torres · Thor (Perro) · Cirugía",
    propietario: "Juan Torres",
    correo: "juan@example.com",
    telefono: "3187141190",
    mascota: "Thor",
    especie: "Perro",
    servicio: "Cirugía",
    hora: 1,
  },
];

const ERROR_GENERICO = "No se pudo procesar la cita. Inténtalo de nuevo.";

const ENTRADA =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2";
const ENTRADA_OK = "border-slate-300 focus:border-teal-500 focus:ring-teal-500/20";
const ENTRADA_ERROR = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function FormularioCita({ franjas, hoy }: { franjas: string[]; hoy: string }) {
  const [propietario, setPropietario] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mascota, setMascota] = useState("");
  const [especie, setEspecie] = useState("");
  const [servicio, setServicio] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [hora, setHora] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  function validar(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!propietario.trim()) e.propietario = "El nombre del propietario es obligatorio";
    if (!correo.trim()) e.correo = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) e.correo = "Correo no válido";
    if (!telefono.trim()) e.telefono = "El teléfono es obligatorio";
    else if (!/^\+?[0-9][0-9\s-]{6,14}$/.test(telefono.trim())) e.telefono = "Teléfono no válido";
    if (!mascota.trim()) e.mascota = "El nombre de la mascota es obligatorio";
    if (!especie.trim()) e.especie = "La especie es obligatoria";
    if (!servicio.trim()) e.servicio = "El servicio es obligatorio";
    if (!fecha) e.fecha = "La fecha es obligatoria";
    else if (fecha < hoy) e.fecha = "La fecha no puede ser pasada";
    if (!hora) e.hora = "Selecciona una franja";
    return e;
  }

  const cerrarModal = useCallback(() => {
    // Si no hubo cupo, el foco vuelve a la franja para elegir otra.
    if (resultado?.tipo === "exito" && resultado.estado === "rechazada") {
      setTimeout(() => document.getElementById("hora")?.focus(), 0);
    }
    setResultado(null);
  }, [resultado]);

  function cargarPrueba(indice: string) {
    const p = PRUEBAS[Number(indice)];
    if (!p) return;
    setPropietario(p.propietario);
    setCorreo(p.correo);
    setTelefono(p.telefono);
    setMascota(p.mascota);
    setEspecie(p.especie);
    setServicio(p.servicio);
    setFecha(hoy);
    setHora(franjas[p.hora % franjas.length] ?? "");
    setErrores({});
    setResultado(null);
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;

    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propietario,
          correo,
          telefono,
          mascota,
          especie,
          servicio,
          fecha,
          hora,
        }),
      });
      const data = await res.json();

      if (res.status === 400 && data.campos) {
        const porCampo: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.campos as Record<string, string[]>)) {
          porCampo[k] = v[0];
        }
        setErrores(porCampo);
      } else if (res.ok && data.ok) {
        setResultado({
          tipo: "exito",
          estado: data.estado,
          mensaje: data.mensaje,
        });
      } else {
        setResultado({ tipo: "error", mensaje: ERROR_GENERICO });
      }
    } catch {
      setResultado({ tipo: "error", mensaje: ERROR_GENERICO });
    } finally {
      setEnviando(false);
    }
  }

  const clase = (campo: string) => `${ENTRADA} ${errores[campo] ? ENTRADA_ERROR : ENTRADA_OK}`;

  return (
    <div className="space-y-5">
      <ModalResultado resultado={resultado} onCerrar={cerrarModal} />

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="prueba" className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Datos de prueba
        </label>
        <select
          id="prueba"
          className={`${ENTRADA} ${ENTRADA_OK} py-2`}
          value=""
          onChange={(e) => cargarPrueba(e.target.value)}
        >
          <option value="">Selecciona para llenar el formulario...</option>
          {PRUEBAS.map((p, i) => (
            <option key={p.etiqueta} value={i}>
              {p.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={enviar}
        noValidate
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <Seccion numero={1} titulo="Propietario">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="propietario" etiqueta="Nombre completo" error={errores.propietario}>
              <input
                id="propietario"
                className={clase("propietario")}
                placeholder="María López"
                value={propietario}
                onChange={(e) => setPropietario(e.target.value)}
              />
            </Campo>
            <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
              <input
                id="correo"
                type="email"
                className={clase("correo")}
                placeholder="maria@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </Campo>
            <Campo id="telefono" etiqueta="Teléfono" error={errores.telefono}>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                className={clase("telefono")}
                placeholder="3001234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Campo>
          </div>
        </Seccion>

        <Seccion numero={2} titulo="Mascota">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="mascota" etiqueta="Nombre de la mascota" error={errores.mascota}>
              <input
                id="mascota"
                className={clase("mascota")}
                placeholder="Luna"
                value={mascota}
                onChange={(e) => setMascota(e.target.value)}
              />
            </Campo>
            <Campo id="especie" etiqueta="Especie" error={errores.especie}>
              <input
                id="especie"
                className={clase("especie")}
                placeholder="Gato"
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
              />
            </Campo>
          </div>
          <Campo id="servicio" etiqueta="Servicio" error={errores.servicio}>
            <input
              id="servicio"
              className={clase("servicio")}
              placeholder="Consulta general"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
            />
          </Campo>
        </Seccion>

        <Seccion numero={3} titulo="Fecha y franja">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
              <input
                id="fecha"
                type="date"
                min={hoy}
                className={clase("fecha")}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Campo>
            <Campo id="hora" etiqueta="Franja horaria" error={errores.hora}>
              <select
                id="hora"
                className={clase("hora")}
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              >
                <option value="">Selecciona una franja</option>
                {franjas.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </Seccion>

        <button
          type="submit"
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {enviando ? "Enviando..." : "Agendar cita"}
        </button>
      </form>
    </div>
  );
}
