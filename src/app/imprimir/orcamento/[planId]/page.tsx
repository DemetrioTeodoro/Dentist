import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { db } from "@/lib/db";
import { PLAN_STATUS, brl, fmtDateOnly } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function PrintPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  await requireUser();
  const { planId } = await params;
  const plan = await db.treatmentPlan.findUnique({
    where: { id: planId },
    include: {
      patient: true,
      dentist: true,
      items: { include: { procedure: true }, orderBy: { id: "asc" } },
      receivables: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!plan) notFound();

  const subtotal = plan.items.reduce((s, i) => s + Number(i.price), 0);
  const total = subtotal - Number(plan.discount);

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-white p-8 text-sm print:p-0">
      <div className="flex items-start justify-between border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-xl font-semibold">🦷 OdontoClínica</h1>
          <p className="text-slate-500">Plano de tratamento / orçamento</p>
        </div>
        <div className="text-right">
          <p>Emitido em {fmtDateOnly(new Date())}</p>
          <p className="text-slate-500">Situação: {PLAN_STATUS[plan.status].label}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Paciente</p>
          <p className="font-medium">{plan.patient.name}</p>
          {plan.patient.cpf && <p>CPF {plan.patient.cpf}</p>}
        </div>
        <div>
          <p className="text-xs uppercase text-slate-500">Dentista responsável</p>
          <p className="font-medium">{plan.dentist.name}</p>
          {plan.dentist.cro && <p>{plan.dentist.cro}</p>}
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Procedimento</th>
            <th>Dente</th>
            <th>Faces</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {plan.items.map((i) => (
            <tr key={i.id}>
              <td>{i.procedure.name}</td>
              <td>{i.tooth ?? "—"}</td>
              <td>{i.faces ?? "—"}</td>
              <td className="text-right">{brl(i.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
        {Number(plan.discount) > 0 && (
          <div className="flex justify-between"><span>Desconto</span><span>− {brl(plan.discount)}</span></div>
        )}
        <div className="flex justify-between border-t border-slate-300 pt-1 text-base font-semibold">
          <span>Total</span><span>{brl(total)}</span>
        </div>
      </div>

      {plan.receivables.length > 0 && (
        <div>
          <p className="mb-1 font-medium">Condições de pagamento</p>
          <ul className="list-inside list-disc">
            {plan.receivables.map((r) => (
              <li key={r.id}>{r.description}: {brl(r.amount)} — venc. {fmtDateOnly(r.dueDate)}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.notes && <p><strong>Observações:</strong> {plan.notes}</p>}

      <p className="text-xs text-slate-500">
        Orçamento válido por 30 dias. Os valores podem ser revistos caso o planejamento clínico precise ser alterado.
      </p>

      <div className="grid grid-cols-2 gap-12 pt-16 text-center">
        <div className="border-t border-slate-400 pt-1">{plan.patient.responsible ?? plan.patient.name}</div>
        <div className="border-t border-slate-400 pt-1">{plan.dentist.name}</div>
      </div>

      <div className="text-center"><PrintButton /></div>
    </main>
  );
}
