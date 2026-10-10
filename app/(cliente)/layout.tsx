import { BannerSeccion } from "@/components/BannerSeccion";

// Sección para el usuario final: el propietario de la mascota.
export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BannerSeccion
        color="teal"
        icono="🐶"
        etiqueta="Portal del cliente"
        audiencia="Para el propietario de la mascota"
        descripcion="Agenda tu cita en línea, sin llamadas ni filas."
      />
      {children}
    </>
  );
}
