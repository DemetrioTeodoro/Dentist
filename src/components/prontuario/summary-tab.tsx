import type { Patient } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { APPOINTMENT_STATUS, fmtDateOnly, fmtDateTime } from "@/lib/format";

export async function SummaryTab({ patient }: { patient: Patient }) {
  const appointments = await db.appointment.findMany({
    where: { patientId: patient.id },
    include: { dentist: { select: { name: true } } },
    orderBy: { startsAt: "desc" },
    take: 10,
  });

  const fields = [
    ["Data de nascimento", patient.birthDate && fmtDateOnly(patient.birthDate)],
    ["Sexo", patient.gender],
    ["Telefone", patient.phone],
    ["E-mail", patient.email],
    ["Endereço", patient.address],
    ["Responsável", patient.responsible],
    ["Observações", patient.notes],
    ["Cadastrado em", fmtDateOnly(patient.createdAt)],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <h2 className="mb-3 font-semibold">Dados cadastrais</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {fields.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-slate-500">{k}</dt>
              <dd>{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Consultas</h2>
        {appointments.length === 0 && <p className="text-sm text-slate-500">Nenhuma consulta registrada.</p>}
        <ul className="divide-y divide-slate-100 text-sm">
          {appointments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 py-2">
              <span>
                {fmtDateTime(a.startsAt)} · {a.dentist.name}
              </span>
              <StatusBadge status={APPOINTMENT_STATUS[a.status]} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
