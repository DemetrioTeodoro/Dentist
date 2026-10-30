import { UserForm } from "@/components/user-form";
import { db } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function UsersPage() {
  await requireUser("ADMIN");
  const users = await db.user.findMany({
    omit: { passwordHash: true },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="page-title">Usuários</h1>
      <div className="card">
        <h2 className="mb-3 font-semibold">Novo usuário</h2>
        <UserForm />
      </div>
      {users.map((u) => (
        <details key={u.id} className="card">
          <summary className="flex cursor-pointer items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: u.color }} />
            <span className={`font-medium ${u.active ? "" : "text-slate-400 line-through"}`}>{u.name}</span>
            <span className="text-sm text-slate-500">{ROLE_LABEL[u.role]} · {u.email}</span>
          </summary>
          <div className="mt-4">
            <UserForm user={{ ...u, commissionPct: Number(u.commissionPct) }} />
          </div>
        </details>
      ))}
    </div>
  );
}
