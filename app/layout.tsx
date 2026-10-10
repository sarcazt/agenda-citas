import type { Metadata } from "next";
import { NavLink } from "@/components/NavLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda de citas",
  description: "Agenda tu cita y consulta la agenda del día.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-lg shadow-sm"
                aria-hidden="true"
              >
                🐾
              </span>
              <span className="text-base font-semibold tracking-tight">Agenda de citas</span>
            </div>
            <div className="flex items-center gap-1">
              <NavLink href="/agendar">Agendar</NavLink>
              <NavLink href="/agenda">Agenda</NavLink>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
