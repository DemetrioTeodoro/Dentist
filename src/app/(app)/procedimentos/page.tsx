import Link from "next/link";
import { db } from "@/lib/db";
import { brl } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { saveProcedure, toggleProcedure } from "./actions";

export default async function ProceduresPage() {
  await requireUser("ADMIN");
  const procedures = await db.procedure.findMany({
    include: { _count: { select: { materials: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="page-title">Procedimentos</h1>

      <form action={saveProcedure} className="card flex flex-wrap items-end gap-2">
        <div className="w-32">
          <label className="label">Código (TUSS)</label>
          <input className="input" name="code" />
        </div>
        <div className="min-w-64 flex-1">
          <label className="label">Nome</label>
          <input className="input" name="name" required />
        </div>
        <div className="w-32">
          <label className="label">Valor (R$)</label>
          <input className="input" name="price" type="number" step="0.01" min={0} required />
        </div>
        <div className="w-28">
          <label className="label">Duração (min)</label>
          <input className="input" name="durationMin" type="number" min={5} step={5} defaultValue={30} />
        </div>
        <button className="btn">Adicionar</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr><th>Código</th><th>Nome</th><th>Valor (R$)</th><th>Duração</th><th></th></tr>
          </thead>
          <tbody>
            {procedures.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td colSpan={4} className="p-0">
                  {/* Cada linha é um formulário de edição inline */}
                  <form action={saveProcedure} className="grid grid-cols-[8rem_1fr_8rem_6rem_auto] items-center gap-2 px-3 py-1.5">
                    <input type="hidden" name="id" value={p.id} />
                    <input className="input py-1" name="code" defaultValue={p.code ?? ""} />
                    <input className="input py-1" name="name" defaultValue={p.name} required />
                    <input className="input py-1" name="price" type="number" step="0.01" defaultValue={Number(p.price)} title={brl(p.price)} />
                    <input className="input py-1" name="durationMin" type="number" step={5} defaultValue={p.durationMin} />
                    <button className="text-xs text-sky-700 hover:underline">Salvar</button>
                  </form>
                </td>
                <td className="whitespace-nowrap text-right">
                  <Link href={`/procedimentos/${p.id}`} className="mr-3 text-xs text-sky-700 hover:underline">
                    Materiais ({p._count.materials})
                  </Link>
                  <form action={toggleProcedure.bind(null, p.id, !p.active)} className="inline">
                    <button className="text-xs text-slate-600 hover:underline">{p.active ? "Desativar" : "Reativar"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
