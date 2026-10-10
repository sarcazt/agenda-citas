import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda de citas",
  description: "Agenda tu cita y consulta la agenda del día.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-2xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <span className="font-semibold">Agenda de citas</span>
            <Link href="/agendar" className="text-slate-600 hover:text-slate-900">
              Agendar
            </Link>
            <Link href="/agenda" className="text-slate-600 hover:text-slate-900">
              Agenda
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
