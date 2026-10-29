import type { Role } from "@prisma/client";
import { addReceivable, payReceivable, undoPayment } from "@/app/(app)/pacientes/[id]/actions";
import { db } from "@/lib/db";
import { PAYMENT_METHOD, brl, fmtDateOnly, fmtDateTime, isoDateOnly } from "@/lib/format";

export async function FinanceTab({ patientId, role }: { patientId: string; role: Role }) {
  const receivables = await db.receivable.findMany({
    where: { patientId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
  const today = isoDateOnly(new Date());
  const open = receivables.filter((r) => !r.paidAt);
  const totalOpen = open.reduce((s, r) => s + Number(r.amount), 0);
  const totalOverdue = open.filter((r) => isoDateOnly(r.dueDate) < today).reduce((s, r) => s + Number(r.amount), 0);
  const totalPaid = receivables.filter((r) => r.paidAt).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-xs text-slate-500">Pago</p><p className="text-xl font-semibold text-emerald-700">{brl(totalPaid)}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Em aberto</p><p className="text-xl font-semibold">{brl(totalOpen)}</p></div>
        <div className="card"><p className="text-xs text-slate-500">Vencido</p><p className="text-xl font-semibold text-red-600">{brl(totalOverdue)}</p></div>
      </div>

      <form action={addReceivable.bind(null, patientId)} className="card flex flex-wrap items-end gap-2">
        <div className="min-w-60 flex-1">
          <label className="label">Lançamento avulso</label>
          <input className="input" name="description" placeholder="Ex.: Consulta de urgência" />
        </div>
        <div className="w-32">
          <label className="label">Valor (R$)</label>
          <input className="input" name="amount" type="number" step="0.01" min={0.01} required />
        </div>
        <div>
          <label className="label">Vencimento</label>
          <input className="input" name="dueDate" type="date" defaultValue={today} required />
        </div>
        <button className="btn-secondary">Lançar</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th className="text-right">Valor</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => {
              const overdue = !r.paidAt && isoDateOnly(r.dueDate) < today;
              return (
                <tr key={r.id}>
                  <td>{r.description}</td>
                  <td className={overdue ? "font-medium text-red-600" : ""}>{fmtDateOnly(r.dueDate)}</td>
                  <td className="text-right">{brl(r.amount)}</td>
                  <td>
                    {r.paidAt ? (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-700">✅ {fmtDateTime(r.paidAt)} · {PAYMENT_METHOD[r.method!]}</span>
                        {role === "ADMIN" && (
                          <form action={undoPayment.bind(null, patientId, r.id)}>
                            <button className="text-red-600 hover:underline">Estornar</button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <form action={payReceivable.bind(null, patientId, r.id)} className="flex gap-2">
                        <select className="input w-40 py-1" name="method">
                          {Object.entries(PAYMENT_METHOD).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button className="btn px-3 py-1">Receber</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {receivables.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-slate-500">Nenhum lançamento.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
