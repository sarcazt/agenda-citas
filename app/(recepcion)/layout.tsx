import { BannerSeccion } from "@/components/BannerSeccion";

// Sección interna: la recepcionista consulta las citas programadas.
export default function RecepcionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BannerSeccion
        color="indigo"
        icono="🗂️"
        etiqueta="Panel de recepción"
        audiencia="Uso interno del personal"
        descripcion="Consulta las citas programadas de cada día para atender a los clientes."
      />
      {children}
    </>
  );
}
