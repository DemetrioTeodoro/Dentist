import Link from "next/link";
import { notFound } from "next/navigation";
import { AnamnesisTab } from "@/components/prontuario/anamnesis-tab";
import { AttachmentsTab } from "@/components/prontuario/attachments-tab";
import { FinanceTab } from "@/components/prontuario/finance-tab";
import { NotesTab } from "@/components/prontuario/notes-tab";
import { SummaryTab } from "@/components/prontuario/summary-tab";
import { TreatmentTab } from "@/components/prontuario/treatment-tab";
import { Odontogram } from "@/components/odontogram";
import { db } from "@/lib/db";
import { age } from "@/lib/format";
import { audit, requireUser } from "@/lib/session";

const TABS = [
  { key: "resumo", label: "Resumo", clinical: false, finance: false },
  { key: "anamnese", label: "Anamnese", clinical: true, finance: false },
  { key: "odontograma", label: "Odontograma", clinical: true, finance: false },
  { key: "evolucao", label: "Evolução", clinical: true, finance: false },
  { key: "anexos", label: "Exames e anexos", clinical: true, finance: false },
  { key: "tratamentos", label: "Orçamentos", clinical: false, finance: false },
  { key: "financeiro", label: "Financeiro", clinical: false, finance: true },
];

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab = "resumo" }] = await Promise.all([params, searchParams]);
  const user = await requireUser();

  const patient = await db.patient.findUnique({
    where: { id },
    include: { anamneses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!patient) notFound();

  // Recepção não vê dados clínicos; dentista não vê o financeiro
  const visible = TABS.filter(
    (t) => !(t.clinical && user.role === "RECEPTION") && !(t.finance && user.role === "DENTIST"),
  );
  const active = visible.find((t) => t.key === tab) ?? visible[0];
  if (active.clinical) await audit(user.userId, `patient.view.${active.key}`, "Patient", id);

  const alerts = patient.anamneses[0];
  const patientAge = age(patient.birthDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{patient.name}</h1>
          <p className="text-sm text-slate-500">
            {[patientAge !== null && `${patientAge} anos`, patient.phone, patient.cpf && `CPF ${patient.cpf}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/agenda?novo=1&paciente=${patient.id}`} className="btn-secondary">Agendar</Link>
          <Link href={`/pacientes/${patient.id}/editar`} className="btn-secondary">Editar cadastro</Link>
        </div>
      </div>

      {user.role !== "RECEPTION" && (alerts?.alerts || alerts?.allergies) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <strong>⚠️ Atenção: </strong>
          {[alerts.allergies && `Alergias: ${alerts.allergies}`, alerts.alerts].filter(Boolean).join(" · ")}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {visible.map((t) => (
          <Link
            key={t.key}
            href={`/pacientes/${id}?tab=${t.key}`}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              t.key === active.key ? "border-sky-600 text-sky-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {active.key === "resumo" && <SummaryTab patient={patient} />}
      {active.key === "anamnese" && <AnamnesisTab patientId={id} />}
      {active.key === "odontograma" && (
        <Odontogram patientId={id} teeth={await db.toothRecord.findMany({ where: { patientId: id } })} />
      )}
      {active.key === "evolucao" && <NotesTab patientId={id} />}
      {active.key === "anexos" && <AttachmentsTab patientId={id} />}
      {active.key === "tratamentos" && <TreatmentTab patientId={id} role={user.role} userId={user.userId} />}
      {active.key === "financeiro" && <FinanceTab patientId={id} role={user.role} />}
    </div>
  );
}
