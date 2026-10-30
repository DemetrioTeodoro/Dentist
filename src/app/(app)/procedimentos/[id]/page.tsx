import Link from "next/link";
import { notFound } from "next/navigation";
import { removeProcedureMaterial, saveProcedureMaterial } from "@/app/(app)/estoque/actions";
import { db } from "@/lib/db";
import { brl, fmtQty } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function ProcedureMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("ADMIN", "DENTIST");
  const { id } = await params;
  const [procedure, products] = await Promise.all([
    db.procedure.findUnique({
      where: { id },
      include: { materials: { include: { product: true }, orderBy: { product: { name: "asc" } } } },
    }),
    db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!procedure) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={user.role === "ADMIN" ? "/procedimentos" : "/estoque"} className="text-sm text-sky-700 hover:underline">
          ← Voltar
        </Link>
        <h1 className="page-title">{procedure.name}</h1>
        <p className="text-sm text-slate-500">
          {procedure.code && `${procedure.code} · `}{brl(procedure.price)} · {procedure.durationMin} min
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">Materiais usados</h2>
          <p className="text-sm text-slate-500">
            Quantidade consumida a cada vez que o procedimento é realizado; a baixa no estoque é automática.
          </p>
        </div>

        <table className="table">
          <thead>
            <tr><th>Produto</th><th>Qtd. por procedimento</th><th className="text-right">Saldo atual</th><th></th></tr>
          </thead>
          <tbody>
            {procedure.materials.length === 0 && (
              <tr><td colSpan={4} className="text-slate-500">Nenhum material cadastrado.</td></tr>
            )}
            {procedure.materials.map((m) => (
              <tr key={m.id}>
                <td>{m.product.name}</td>
                <td>
                  <form action={saveProcedureMaterial.bind(null, procedure.id)} className="flex items-center gap-2">
                    <input type="hidden" name="productId" value={m.productId} />
                    <input className="input w-24 py-1" name="quantity" type="number" step="0.01" min={0.01} defaultValue={Number(m.quantity)} />
                    <span className="text-xs text-slate-500">{m.product.unit}</span>
                    <button className="text-xs text-sky-700 hover:underline">Salvar</button>
                  </form>
                </td>
                <td className={`text-right ${Number(m.product.stock) < Number(m.quantity) ? "font-semibold text-red-600" : ""}`}>
                  {fmtQty(m.product.stock)} {m.product.unit}
                </td>
                <td className="text-right">
                  <form action={removeProcedureMaterial.bind(null, procedure.id, m.id)}>
                    <button className="text-xs text-red-600 hover:underline">Remover</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 ? (
          <p className="text-sm text-slate-500">
            Cadastre os produtos em <Link href="/estoque" className="text-sky-700 hover:underline">Estoque</Link> primeiro.
          </p>
        ) : (
          <form action={saveProcedureMaterial.bind(null, procedure.id)} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <div className="min-w-64 flex-1">
              <label className="label">Produto</label>
              <select className="input" name="productId" required>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="label">Quantidade</label>
              <input className="input" name="quantity" type="number" step="0.01" min={0.01} defaultValue={1} required />
            </div>
            <button className="btn-secondary">Adicionar material</button>
          </form>
        )}
      </div>
    </div>
  );
}
