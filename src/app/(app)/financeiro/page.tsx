import Link from "next/link";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/db";
import { PAYMENT_METHOD, brl, fmtDateOnly, isoDateOnly, toNumber } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { addExpense, deleteExpense } from "./actions";

const EXPENSE_CATEGORIES = ["Material", "Laboratório", "Aluguel", "Salários", "Impostos", "Marketing", "Manutenção", "Outros"];

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const user = await requireUser("ADMIN", "RECEPTION");
  const { mes } = await searchParams;
  const monthKey = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : format(new Date(), "yyyy-MM");

  // Intervalos: datas puras (@db.Date) em UTC; timestamps (paidAt, doneAt) no fuso local
  const dateStart = new Date(`${monthKey}-01T00:00:00Z`);
  const dateEnd = addMonths(dateStart, 1);
  const tsStart = new Date(`${monthKey}-01T00:00`);
  const tsEnd = addMonths(tsStart, 1);
  const today = new Date(`${isoDateOnly(new Date())}T00:00:00Z`);

  const [received, dueInMonth, overdue, expenses, doneItems, dentists] = await Promise.all([
    db.receivable.findMany({ where: { paidAt: { gte: tsStart, lt: tsEnd } } }),
    db.receivable.findMany({
      where: { paidAt: null, dueDate: { gte: dateStart, lt: dateEnd } },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.receivable.findMany({
      where: { paidAt: null, dueDate: { lt: today } },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { dueDate: "asc" },
    }),
    db.expense.findMany({ where: { date: { gte: dateStart, lt: dateEnd } }, orderBy: { date: "desc" } }),
    db.treatmentItem.findMany({ where: { status: "DONE", doneAt: { gte: tsStart, lt: tsEnd } } }),
    db.user.findMany({ where: { role: "DENTIST" }, orderBy: { name: "asc" } }),
  ]);

  const sum = (xs: { amount: unknown }[]) => xs.reduce((s, x) => s + toNumber(x.amount as number), 0);
  const totalReceived = sum(received);
  const totalExpenses = sum(expenses);

  const byMethod = Object.entries(PAYMENT_METHOD)
    .map(([k, label]) => ({ label, total: sum(received.filter((r) => r.method === k)) }))
    .filter((m) => m.total > 0);

  const commissions = dentists
    .map((d) => {
      const produced = doneItems.filter((i) => i.doneById === d.id).reduce((s, i) => s + Number(i.price), 0);
      return { name: d.name, pct: Number(d.commissionPct), produced, commission: (produced * Number(d.commissionPct)) / 100 };
    })
    .filter((c) => c.produced > 0);

  const kpis = [
    { label: "Recebido no mês", value: totalReceived, cls: "text-emerald-700" },
    { label: "A receber no mês", value: sum(dueInMonth), cls: "" },
    { label: "Vencido (total)", value: sum(overdue), cls: "text-red-600" },
    { label: "Despesas no mês", value: totalExpenses, cls: "text-orange-600" },
    { label: "Saldo do mês", value: totalReceived - totalExpenses, cls: totalReceived >= totalExpenses ? "text-emerald-700" : "text-red-600" },
  ];

  const monthLink = (delta: number) => `/financeiro?mes=${format(addMonths(tsStart, delta), "yyyy-MM")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Financeiro</h1>
        <div className="flex items-center gap-2">
          <Link href={monthLink(-1)} className="btn-secondary">←</Link>
          <span className="min-w-40 text-center font-medium first-letter:uppercase">{format(tsStart, "MMMM 'de' yyyy", { locale: ptBR })}</span>
          <Link href={monthLink(1)} className="btn-secondary">→</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`text-xl font-semibold ${k.cls}`}>{brl(k.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Recebimentos por forma de pagamento</h2>
          {byMethod.length === 0 && <p className="text-sm text-slate-500">Nenhum recebimento no período.</p>}
          <ul className="space-y-2 text-sm">
            {byMethod.map((m) => (
              <li key={m.label}>
                <div className="flex justify-between"><span>{m.label}</span><span className="font-medium">{brl(m.total)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(m.total / totalReceived) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Produção e comissão por dentista</h2>
          {commissions.length === 0 && <p className="text-sm text-slate-500">Nenhum procedimento realizado no período.</p>}
          {commissions.length > 0 && (
            <table className="table">
              <thead><tr><th>Dentista</th><th className="text-right">Produção</th><th className="text-right">%</th><th className="text-right">Comissão</th></tr></thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td className="text-right">{brl(c.produced)}</td>
                    <td className="text-right">{c.pct}%</td>
                    <td className="text-right font-medium">{brl(c.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">Inadimplência <span className="text-sm font-normal text-slate-500">({overdue.length} parcelas vencidas)</span></h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma parcela vencida. 🎉</p>
        ) : (
          <table className="table">
            <thead><tr><th>Paciente</th><th>Telefone</th><th>Descrição</th><th>Vencimento</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {overdue.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/pacientes/${r.patient.id}?tab=financeiro`} className="text-sky-700 hover:underline">{r.patient.name}</Link></td>
                  <td>{r.patient.phone ?? "—"}</td>
                  <td>{r.description}</td>
                  <td className="text-red-600">{fmtDateOnly(r.dueDate)}</td>
                  <td className="text-right">{brl(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card overflow-x-auto">
        <h2 className="mb-3 font-semibold">A receber neste mês</h2>
        {dueInMonth.length === 0 ? (
          <p className="text-sm text-slate-500">Nada em aberto com vencimento neste mês.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Paciente</th><th>Descrição</th><th>Vencimento</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {dueInMonth.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/pacientes/${r.patient.id}?tab=financeiro`} className="text-sky-700 hover:underline">{r.patient.name}</Link></td>
                  <td>{r.description}</td>
                  <td>{fmtDateOnly(r.dueDate)}</td>
                  <td className="text-right">{brl(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card space-y-4 overflow-x-auto">
        <h2 className="font-semibold">Despesas</h2>
        <form action={addExpense} className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1">
            <label className="label">Descrição</label>
            <input className="input" name="description" required />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select className="input" name="category">
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="label">Valor (R$)</label>
            <input className="input" name="amount" type="number" step="0.01" min={0.01} required />
          </div>
          <div>
            <label className="label">Data</label>
            <input className="input" name="date" type="date" defaultValue={isoDateOnly(new Date())} required />
          </div>
          <button className="btn-secondary">Lançar</button>
        </form>
        <table className="table">
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th></th></tr></thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td>{fmtDateOnly(e.date)}</td>
                <td>{e.description}</td>
                <td>{e.category}</td>
                <td className="text-right">{brl(e.amount)}</td>
                <td className="text-right">
                  {user.role === "ADMIN" && (
                    <form action={deleteExpense.bind(null, e.id)}>
                      <button className="text-xs text-red-600 hover:underline">Excluir</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-slate-500">Nenhuma despesa no período.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
