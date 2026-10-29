import { addClinicalNote } from "@/app/(app)/pacientes/[id]/actions";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

export async function NotesTab({ patientId }: { patientId: string }) {
  const notes = await db.clinicalNote.findMany({
    where: { patientId },
    include: { dentist: { select: { name: true, cro: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <form action={addClinicalNote.bind(null, patientId)} className="card space-y-3">
        <label className="label">Nova evolução</label>
        <textarea className="input" name="content" rows={4} required placeholder="Descreva o atendimento realizado, conduta e orientações..." />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Registros de evolução não podem ser editados nem excluídos.</p>
          <button className="btn">Registrar</button>
        </div>
      </form>

      <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
        {notes.map((n) => (
          <li key={n.id} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-sky-500" />
            <p className="text-xs text-slate-500">
              {fmtDateTime(n.createdAt)} · {n.dentist.name}
              {n.dentist.cro && ` (${n.dentist.cro})`}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{n.content}</p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-slate-500">Nenhuma evolução registrada.</p>}
      </ol>
    </div>
  );
}
