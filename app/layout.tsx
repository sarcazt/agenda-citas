import type { Metadata } from "next";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda de citas",
  description: "Agenda tu cita y consulta la agenda del día.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-lg shadow-sm"
                aria-hidden="true"
              >
                🐾
              </span>
              <span className="text-base font-semibold tracking-tight">Agenda de citas</span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/agendar" acento="teal">
                Portal del cliente
              </NavLink>
              <NavLink href="/agenda" acento="indigo">
                Panel de recepción
              </NavLink>
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>

        <footer className="border-t border-slate-200 bg-white/70">
          <p className="mx-auto max-w-3xl px-4 py-4 text-xs leading-relaxed text-slate-500">
            Proyecto académico: el portal del cliente y el panel de recepción conviven en esta misma
            aplicación solo con fines educativos. En un entorno real serían sistemas separados, y el
            panel de recepción tendría acceso restringido al personal.
          </p>
        </footer>
      </body>
    </html>
  );
}
