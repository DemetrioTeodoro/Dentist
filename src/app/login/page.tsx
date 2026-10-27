"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 p-4">
      <form action={action} className="card w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="text-3xl">🦷</div>
          <h1 className="mt-2 text-xl font-semibold">OdontoClínica</h1>
          <p className="text-sm text-slate-500">Acesse sua conta</p>
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input className="input" id="email" name="email" type="email" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">Senha</label>
          <input className="input" id="password" name="password" type="password" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
