"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ACTIVO = {
  teal: "bg-teal-600 text-white shadow-sm",
  indigo: "bg-indigo-600 text-white shadow-sm",
} as const;

export function NavLink({
  href,
  acento,
  children,
}: {
  href: string;
  acento: keyof typeof ACTIVO;
  children: React.ReactNode;
}) {
  const activo = usePathname() === href;
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        activo ? ACTIVO[acento] : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}
