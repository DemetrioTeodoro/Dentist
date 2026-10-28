import Link from "next/link";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { APPOINTMENT_STATUS, brl, fmtTime, isoDateOnly } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const dayStart = new Date(`${format(now, "yyyy-MM-dd")}T00:00`);
  const dayEnd = addDays(dayStart, 1);
  const todayUtc = new Date(`${isoDateOnly(now)}T00:00:00Z`);
  const seesFinance = user.role !== "DENTIST";

  const [appointments, patientCount, receivedToday, overdue, birthdays] = await Promise.all([
    db.appointment.findMany({
      where: {
        startsAt: { gte: dayStart, lt: dayEnd },
        ...(user.role === "DENTIST" && { dentistId: user.userId }),
      },
      include: { patient: { select: { id: true, name: true } }, dentist: { select: { name: true, color: true } } },
      orderBy: { startsAt: "asc" },
    }),
    db.patient.count({ where: { active: true } }),
    seesFinance ? db.receivable.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: dayStart, lt: dayEnd } } }) : null,
    seesFinance ? db.receivable.aggregate({ _sum: { amount: true }, _count: true, where: { paidAt: null, dueDate: { lt: todayUtc } } }) : null,
    // Aniversariantes do dia (comparando dia/mês da data de nascimento)
    db.$queryRaw<{ id: string; name: string }[]>`
      SELECT id, name FROM "Patient"
      WHERE active AND EXTRACT(MONTH FROM "birthDate") = ${now.getMonth() + 1}
        AND EXTRACT(DAY FROM "birthDate") = ${now.getDate()}
      ORDER BY name`,
  ]);

  const active = appointments.filter((a) => a.status !== "CANCELED");
  const waiting = appointments.filter((a) => a.status === "ARRIVED").length;

  const kpis = [
    { label: user.role === "DENTIST" ? "Minhas consultas hoje" : "Consultas hoje", value: String(active.length) },
    { label: "Aguardando atendimento", value: String(waiting) },
    { label: "Pacientes ativos", value: String(patientCount) },
    ...(seesFinance
      ? [
          { label: "Recebido hoje", value: brl(receivedToday?._sum.amount ?? 0) },
          { label: `Vencido (${overdue?._count ?? 0} parcelas)`, value: brl(overdue?._sum.amount ?? 0) },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Olá, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm first-letter:uppercase text-slate-500">{format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-2xl font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Atendimentos de hoje</h2>
            <Link href="/agenda" className="text-sm text-sky-700 hover:underline">Ver agenda →</Link>
          </div>
          {appointments.length === 0 && <p className="text-sm text-slate-500">Nenhuma consulta agendada para hoje.</p>}
          <ul className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-12 font-mono text-slate-500">{fmtTime(a.startsAt)}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.dentist.color }} />
                  <Link
                    href={user.role === "RECEPTION" ? `/agenda?appt=${a.id}` : `/pacientes/${a.patient.id}?tab=evolucao`}
                    className="font-medium hover:underline"
                  >
                    {a.patient.name}
                  </Link>
                  {user.role !== "DENTIST" && <span className="text-slate-500">{a.dentist.name}</span>}
                </div>
                <StatusBadge status={APPOINTMENT_STATUS[a.status]} />
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">🎂 Aniversariantes de hoje</h2>
          {birthdays.length === 0 && <p className="text-sm text-slate-500">Nenhum aniversariante hoje.</p>}
          <ul className="space-y-1 text-sm">
            {birthdays.map((b) => (
              <li key={b.id}>
                <Link href={`/pacientes/${b.id}`} className="text-sky-700 hover:underline">{b.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
