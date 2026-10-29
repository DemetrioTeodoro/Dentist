import Link from "next/link";
import type { Role } from "@prisma/client";
import {
  addPlanItem,
  approvePlan,
  completeItem,
  createPlan,
  removePlanItem,
  setPlanStatus,
  updatePlanDetails,
} from "@/app/(app)/pacientes/[id]/actions";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { PLAN_STATUS, brl, fmtDateOnly, fmtDateTime, isoDateOnly } from "@/lib/format";

export async function TreatmentTab({ patientId, role, userId }: { patientId: string; role: Role; userId: string }) {
  const [plans, procedures, dentists] = await Promise.all([
    db.treatmentPlan.findMany({
      where: { patientId },
      include: {
        dentist: { select: { name: true } },
        items: { include: { procedure: true, doneBy: { select: { name: true } } }, orderBy: { id: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.procedure.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: "DENTIST", active: true }, orderBy: { name: "asc" } }),
  ]);
  const canExecute = role !== "RECEPTION";

  return (
    <div className="space-y-6">
      <form action={createPlan.bind(null, patientId)} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Dentista responsável</label>
          <select className="input" name="dentistId" defaultValue={role === "DENTIST" ? userId : undefined}>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <button className="btn">+ Novo orçamento</button>
      </form>

      {plans.length === 0 && <p className="text-sm text-slate-500">Nenhum orçamento ou plano de tratamento.</p>}

      {plans.map((plan) => {
        const subtotal = plan.items.reduce((s, i) => s + Number(i.price), 0);
        const total = subtotal - Number(plan.discount);
        const draft = plan.status === "DRAFT";
        return (
          <div key={plan.id} className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <StatusBadge status={PLAN_STATUS[plan.status]} />
                <span className="text-sm text-slate-600">
                  Criado em {fmtDateTime(plan.createdAt)} · {plan.dentist.name}
                  {plan.approvedAt && ` · aprovado em ${fmtDateOnly(plan.approvedAt)}`}
                </span>
              </div>
              <Link href={`/imprimir/orcamento/${plan.id}`} target="_blank" className="btn-secondary">
                🖨️ Imprimir
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Procedimento</th>
                    <th>Dente</th>
                    <th>Faces</th>
                    <th className="text-right">Valor</th>
                    <th>Situação</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.procedure.name}</td>
                      <td>{item.tooth ?? "—"}</td>
                      <td>{item.faces ?? "—"}</td>
                      <td className="text-right">{brl(item.price)}</td>
                      <td className="text-xs">
                        {item.status === "DONE"
                          ? `✅ ${fmtDateOnly(item.doneAt!)} · ${item.doneBy?.name}`
                          : "Pendente"}
                      </td>
                      <td className="text-right">
                        {draft && (
                          <form action={removePlanItem.bind(null, patientId, plan.id, item.id)}>
                            <button className="text-xs text-red-600 hover:underline">Remover</button>
                          </form>
                        )}
                        {plan.status === "APPROVED" && item.status === "PENDING" && canExecute && (
                          <form action={completeItem.bind(null, patientId, item.id)}>
                            <button className="text-xs font-medium text-emerald-700 hover:underline">Marcar realizado</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-sm">
                  <tr>
                    <td colSpan={3} className="text-right text-slate-500">Subtotal</td>
                    <td className="text-right">{brl(subtotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                  {Number(plan.discount) > 0 && (
                    <tr>
                      <td colSpan={3} className="text-right text-slate-500">Desconto</td>
                      <td className="text-right">− {brl(plan.discount)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  )}
                  <tr className="font-semibold">
                    <td colSpan={3} className="text-right">Total</td>
                    <td className="text-right">{brl(total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {plan.notes && <p className="text-sm text-slate-600">Obs.: {plan.notes}</p>}

            {draft && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <form action={addPlanItem.bind(null, patientId, plan.id)} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-64 flex-1">
                    <label className="label">Procedimento</label>
                    <select className="input" name="procedureId" required>
                      {procedures.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {brl(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="label">Dente</label>
                    <input className="input" name="tooth" type="number" min={11} max={85} />
                  </div>
                  <div className="w-20">
                    <label className="label">Faces</label>
                    <input className="input" name="faces" placeholder="MOD" maxLength={5} />
                  </div>
                  <div className="w-28">
                    <label className="label">Valor (opcional)</label>
                    <input className="input" name="price" type="number" step="0.01" min={0} placeholder="Tabela" />
                  </div>
                  <button className="btn-secondary">Adicionar</button>
                </form>

                <form action={updatePlanDetails.bind(null, patientId, plan.id)} className="flex flex-wrap items-end gap-2">
                  <div className="w-32">
                    <label className="label">Desconto (R$)</label>
                    <input className="input" name="discount" type="number" step="0.01" min={0} defaultValue={Number(plan.discount)} />
                  </div>
                  <div className="min-w-64 flex-1">
                    <label className="label">Observações</label>
                    <input className="input" name="notes" defaultValue={plan.notes ?? ""} />
                  </div>
                  <button className="btn-secondary">Atualizar</button>
                </form>

                <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <form action={approvePlan.bind(null, patientId, plan.id)} className="flex flex-wrap items-end gap-2">
                    <div className="w-28">
                      <label className="label">Parcelas</label>
                      <select className="input" name="installments">
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}x {brl(total / (i + 1))}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">1º vencimento</label>
                      <input className="input" name="firstDue" type="date" defaultValue={isoDateOnly(new Date())} />
                    </div>
                    <button className="btn" disabled={plan.items.length === 0}>Aprovar orçamento</button>
                  </form>
                  <form action={setPlanStatus.bind(null, patientId, plan.id, "REJECTED")}>
                    <button className="text-sm text-red-600 hover:underline">Paciente recusou</button>
                  </form>
                </div>
              </div>
            )}

            {plan.status === "APPROVED" && role === "ADMIN" && (
              <form action={setPlanStatus.bind(null, patientId, plan.id, "CANCELED")} className="text-right">
                <button className="text-xs text-red-600 hover:underline">Cancelar tratamento (remove parcelas em aberto)</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
