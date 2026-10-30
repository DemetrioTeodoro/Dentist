"use client";

import { useActionState } from "react";
import type { User } from "@prisma/client";
import { saveUser } from "@/app/(app)/usuarios/actions";

type SafeUser = Omit<User, "passwordHash" | "commissionPct"> & { commissionPct: number };

export function UserForm({ user }: { user?: SafeUser }) {
  const [error, action, pending] = useActionState(saveUser, null);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4">
      {user && <input type="hidden" name="id" value={user.id} />}
      <div className="sm:col-span-2">
        <label className="label">Nome</label>
        <input className="input" name="name" defaultValue={user?.name} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label">E-mail</label>
        <input className="input" name="email" type="email" defaultValue={user?.email} required />
      </div>
      <div>
        <label className="label">Perfil</label>
        <select className="input" name="role" defaultValue={user?.role ?? "DENTIST"}>
          <option value="DENTIST">Dentista</option>
          <option value="RECEPTION">Recepção</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <div>
        <label className="label">CRO</label>
        <input className="input" name="cro" defaultValue={user?.cro ?? ""} />
      </div>
      <div>
        <label className="label">Comissão (%)</label>
        <input className="input" name="commissionPct" type="number" step="0.5" min={0} max={100} defaultValue={user?.commissionPct ?? 0} />
      </div>
      <div>
        <label className="label">Cor na agenda</label>
        <input className="input h-10 p-1" name="color" type="color" defaultValue={user?.color ?? "#0ea5e9"} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">{user ? "Nova senha (deixe em branco para manter)" : "Senha"}</label>
        <input className="input" name="password" type="password" autoComplete="new-password" required={!user} />
      </div>
      <div className="flex items-end gap-4 sm:col-span-2">
        {user && (
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={user.active} /> Ativo
          </label>
        )}
        <button className="btn" disabled={pending}>{pending ? "Salvando..." : user ? "Salvar" : "Criar usuário"}</button>
        {error && <p className="pb-2 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
