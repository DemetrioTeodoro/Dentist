import { Nav } from "@/components/nav";
import { ROLE_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items = [
    { href: "/", label: "Início", icon: "🏠" },
    { href: "/agenda", label: "Agenda", icon: "📅" },
    { href: "/pacientes", label: "Pacientes", icon: "🧑‍⚕️" },
    { href: "/estoque", label: "Estoque", icon: "📦" },
    ...(user.role !== "DENTIST" ? [{ href: "/financeiro", label: "Financeiro", icon: "💰" }] : []),
    ...(user.role === "ADMIN"
      ? [
          { href: "/procedimentos", label: "Procedimentos", icon: "🛠️" },
          { href: "/usuarios", label: "Usuários", icon: "👥" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-2 text-lg font-semibold">
          <span>🦷</span> OdontoClínica
        </div>
        <Nav items={items} />
        <div className="border-t border-slate-200 pt-4 md:mt-auto">
          <p className="px-2 text-sm font-medium">{user.name}</p>
          <p className="px-2 text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
          <form action={logout}>
            <button className="mt-2 w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-100">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
