import { saveAnamnesis } from "@/app/(app)/pacientes/[id]/actions";
import { db } from "@/lib/db";
import { ANAMNESIS_QUESTIONS, fmtDateTime } from "@/lib/format";

export async function AnamnesisTab({ patientId }: { patientId: string }) {
  const history = await db.anamnesis.findMany({
    where: { patientId },
    include: { filledBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const latest = history[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <form action={saveAnamnesis.bind(null, patientId)} className="card space-y-4">
        <div>
          <h2 className="font-semibold">Questionário de saúde</h2>
          <p className="text-xs text-slate-500">Salvar cria uma nova versão; as anteriores ficam no histórico.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {ANAMNESIS_QUESTIONS.map((q, i) => (
            <div key={q} className="grid items-center gap-2 py-2 sm:grid-cols-[1fr_auto_1fr]">
              <span className="text-sm">{q}</span>
              <div className="flex gap-3 text-sm">
                {["Sim", "Não"].map((opt) => (
                  <label key={opt} className="flex items-center gap-1">
                    <input type="radio" name={`q${i}`} value={opt} /> {opt}
                  </label>
                ))}
              </div>
              <input className="input" name={`d${i}`} placeholder="Detalhes" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Alergias</label>
            <input className="input" name="allergies" defaultValue={latest?.allergies ?? ""} placeholder="Ex.: penicilina, látex" />
          </div>
          <div>
            <label className="label">Medicamentos em uso</label>
            <input className="input" name="medications" defaultValue={latest?.medications ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Alertas clínicos (aparecem em destaque no prontuário)</label>
            <input className="input" name="alerts" defaultValue={latest?.alerts ?? ""} placeholder="Ex.: cardiopata — consultar médico antes de cirurgia" />
          </div>
        </div>
        <button className="btn">Salvar anamnese</button>
      </form>

      <div className="space-y-4">
        <h2 className="font-semibold">Histórico</h2>
        {history.length === 0 && <p className="text-sm text-slate-500">Nenhuma anamnese registrada.</p>}
        {history.map((a) => (
          <details key={a.id} className="card p-4" open={a.id === latest?.id}>
            <summary className="cursor-pointer text-sm font-medium">
              {fmtDateTime(a.createdAt)} · {a.filledBy.name}
            </summary>
            <dl className="mt-3 space-y-1 text-sm">
              {Object.entries(a.answers as Record<string, string>).map(([q, r]) => (
                <div key={q}>
                  <dt className="text-slate-500">{q}</dt>
                  <dd className={r.startsWith("Sim") ? "font-medium text-red-700" : ""}>{r}</dd>
                </div>
              ))}
              {a.allergies && <p><strong>Alergias:</strong> {a.allergies}</p>}
              {a.medications && <p><strong>Medicamentos:</strong> {a.medications}</p>}
              {a.alerts && <p><strong>Alertas:</strong> {a.alerts}</p>}
            </dl>
          </details>
        ))}
      </div>
    </div>
  );
}
