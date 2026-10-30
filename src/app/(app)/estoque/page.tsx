import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { STOCK_MOVE_TYPE, fmtDateTime, fmtQty } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { moveStock, saveProduct, toggleProduct } from "./actions";

export default async function StockPage() {
  const user = await requireUser();
  const [products, moves, procedures] = await Promise.all([
    db.product.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.stockMovement.findMany({
      include: {
        product: { select: { name: true, unit: true } },
        user: { select: { name: true } },
        treatmentItem: { select: { procedure: { select: { name: true } }, plan: { select: { patient: { select: { id: true, name: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.procedure.findMany({
      where: { active: true },
      include: { materials: { include: { product: { select: { name: true } } } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const active = products.filter((p) => p.active);
  const low = active.filter((p) => Number(p.stock) <= Number(p.minStock));
  const canManage = user.role !== "RECEPTION";

  return (
    <div className="space-y-6">
      <h1 className="page-title">Estoque</h1>

      {low.length > 0 && (
        <div className="card border-amber-300 bg-amber-50">
          <p className="mb-1 text-sm font-semibold text-amber-800">⚠️ Repor estoque ({low.length})</p>
          <p className="text-sm text-amber-800">
            {low.map((p) => `${p.name}: ${fmtQty(p.stock)} ${p.unit} (mín. ${fmtQty(p.minStock)})`).join(" · ")}
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={moveStock} className="card space-y-3">
          <h2 className="font-semibold">Movimentar estoque</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="label">Produto</label>
              <select className="input" name="productId" required>
                {active.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — saldo {fmtQty(p.stock)} {p.unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" name="type">
                <option value="IN">Entrada (compra)</option>
                <option value="OUT">Saída (perda/uso avulso)</option>
                <option value="ADJUST">Ajuste (saldo contado)</option>
              </select>
            </div>
            <div>
              <label className="label">Quantidade</label>
              <input className="input" name="quantity" type="number" step="0.01" min={0} required />
            </div>
            <div className="col-span-2">
              <label className="label">Observação</label>
              <input className="input" name="notes" placeholder="Ex.: NF 1234, fornecedor X" />
            </div>
          </div>
          <button className="btn" disabled={active.length === 0}>Registrar</button>
        </form>

        {canManage && (
          <form action={saveProduct} className="card space-y-3">
            <h2 className="font-semibold">Novo produto</h2>
            <div className="grid grid-cols-[1fr_6rem_7rem] gap-2">
              <div>
                <label className="label">Nome</label>
                <input className="input" name="name" placeholder="Ex.: Gaze estéril" required />
              </div>
              <div>
                <label className="label">Unidade</label>
                <input className="input" name="unit" defaultValue="un" />
              </div>
              <div>
                <label className="label">Estoque mínimo</label>
                <input className="input" name="minStock" type="number" step="0.01" min={0} defaultValue={0} />
              </div>
            </div>
            <p className="text-xs text-slate-500">O saldo inicial é lançado como uma entrada em “Movimentar estoque”.</p>
            <button className="btn-secondary">Adicionar produto</button>
          </form>
        )}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr><th>Produto</th><th>Unidade</th><th>Mínimo</th><th className="text-right">Saldo</th><th></th></tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={5} className="text-slate-500">Nenhum produto cadastrado.</td></tr>
            )}
            {products.map((p) => {
              const stock = Number(p.stock);
              const stockCls = stock < 0 ? "text-red-600" : stock <= Number(p.minStock) ? "text-amber-700" : "";
              return (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td colSpan={3} className="p-0">
                    {canManage ? (
                      <form action={saveProduct} className="grid grid-cols-[1fr_6rem_7rem_auto] items-center gap-2 px-3 py-1.5">
                        <input type="hidden" name="id" value={p.id} />
                        <input className="input py-1" name="name" defaultValue={p.name} required />
                        <input className="input py-1" name="unit" defaultValue={p.unit} />
                        <input className="input py-1" name="minStock" type="number" step="0.01" min={0} defaultValue={Number(p.minStock)} />
                        <button className="text-xs text-sky-700 hover:underline">Salvar</button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-[1fr_6rem_7rem] px-3 py-2">
                        <span>{p.name}</span><span>{p.unit}</span><span>{fmtQty(p.minStock)}</span>
                      </div>
                    )}
                  </td>
                  <td className={`text-right font-semibold ${stockCls}`}>{fmtQty(p.stock)}</td>
                  <td className="text-right">
                    {user.role === "ADMIN" && (
                      <form action={toggleProduct.bind(null, p.id, !p.active)}>
                        <button className="text-xs text-slate-600 hover:underline">{p.active ? "Desativar" : "Reativar"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3">
        <div>
          <h2 className="font-semibold">Materiais por procedimento</h2>
          <p className="text-sm text-slate-500">
            Ao marcar um procedimento como realizado no plano de tratamento, esses materiais são baixados do estoque automaticamente.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Procedimento</th><th>Materiais</th><th></th></tr>
            </thead>
            <tbody>
              {procedures.map((proc) => (
                <tr key={proc.id}>
                  <td>{proc.name}</td>
                  <td className="text-xs text-slate-600">
                    {proc.materials.length
                      ? proc.materials.map((m) => `${fmtQty(m.quantity)}× ${m.product.name}`).join(", ")
                      : "—"}
                  </td>
                  <td className="text-right">
                    {canManage && (
                      <Link href={`/procedimentos/${proc.id}`} className="text-xs text-sky-700 hover:underline">
                        Editar materiais
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Últimas movimentações</h2>
        <table className="table">
          <thead>
            <tr><th>Data</th><th>Tipo</th><th>Produto</th><th className="text-right">Qtd.</th><th>Origem</th><th>Usuário</th></tr>
          </thead>
          <tbody>
            {moves.length === 0 && (
              <tr><td colSpan={6} className="text-slate-500">Nenhuma movimentação.</td></tr>
            )}
            {moves.map((m) => {
              const q = Number(m.quantity);
              const patient = m.treatmentItem?.plan.patient;
              return (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{fmtDateTime(m.createdAt)}</td>
                  <td><StatusBadge status={STOCK_MOVE_TYPE[m.type]} /></td>
                  <td>{m.product.name}</td>
                  <td className={`text-right font-medium ${q < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {q > 0 ? "+" : ""}{fmtQty(q)} {m.product.unit}
                  </td>
                  <td className="text-xs text-slate-600">
                    {m.treatmentItem && patient ? (
                      <>
                        {m.treatmentItem.procedure.name} —{" "}
                        <Link href={`/pacientes/${patient.id}`} className="text-sky-700 hover:underline">{patient.name}</Link>
                      </>
                    ) : (
                      m.notes ?? "—"
                    )}
                  </td>
                  <td className="text-xs">{m.user.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
