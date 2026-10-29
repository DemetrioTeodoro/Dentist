import Link from "next/link";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppointmentStatus } from "@prisma/client";
import { AppointmentForm } from "@/components/appointment-form";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/lib/db";
import { APPOINTMENT_STATUS, fmtTime } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { setAppointmentStatus } from "./actions";

const START_HOUR = 7;
const END_HOUR = 20;
const SLOT_MIN = 30;
const SLOT_PX = 44;

const toKey = (d: Date) => format(d, "yyyy-MM-dd");

// Próximos passos possíveis a partir de cada status
const NEXT_STATUS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "ARRIVED", "NO_SHOW", "CANCELED"],
  CONFIRMED: ["ARRIVED", "NO_SHOW", "CANCELED"],
  ARRIVED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["DONE"],
  DONE: [],
  NO_SHOW: ["SCHEDULED"],
  CANCELED: ["SCHEDULED"],
};

function whatsappLink(phone: string, name: string, when: Date, dentist: string) {
  const digits = phone.replace(/\D/g, "");
  const text = `Olá, ${name.split(" ")[0]}! Confirmamos sua consulta com ${dentist} em ${format(when, "dd/MM 'às' HH:mm")}. Responda SIM para confirmar.`;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}?text=${encodeURIComponent(text)}`;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; novo?: string; paciente?: string; dentista?: string; hora?: string; appt?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const dateKey = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : toKey(new Date());
  const day = new Date(`${dateKey}T00:00`);

  const [dentists, appointments, preselected, selectedAppt] = await Promise.all([
    db.user.findMany({
      where: { role: "DENTIST", active: true },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    db.appointment.findMany({
      where: { startsAt: { gte: day, lt: addDays(day, 1) } },
      include: { patient: { select: { id: true, name: true, phone: true } } },
      orderBy: { startsAt: "asc" },
    }),
    sp.paciente ? db.patient.findUnique({ where: { id: sp.paciente }, select: { id: true, name: true, phone: true } }) : null,
    sp.appt
      ? db.appointment.findUnique({
          where: { id: sp.appt },
          include: { patient: true, dentist: { select: { name: true } } },
        })
      : null,
  ]);

  const slots = Array.from({ length: ((END_HOUR - START_HOUR) * 60) / SLOT_MIN }, (_, i) => {
    const minutes = START_HOUR * 60 + i * SLOT_MIN;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  });
  const top = (d: Date) => ((d.getHours() * 60 + d.getMinutes() - START_HOUR * 60) / SLOT_MIN) * SLOT_PX;
  const showForm = sp.novo === "1";
  const defaultDentist = sp.dentista ?? (user.role === "DENTIST" ? user.userId : dentists[0]?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="text-sm first-letter:uppercase text-slate-500">{format(day, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/agenda?data=${toKey(addDays(day, -1))}`} className="btn-secondary">←</Link>
          <Link href="/agenda" className="btn-secondary">Hoje</Link>
          <Link href={`/agenda?data=${toKey(addDays(day, 1))}`} className="btn-secondary">→</Link>
          <form className="flex gap-2">
            <input className="input" type="date" name="data" defaultValue={dateKey} />
            <button className="btn-secondary">Ir</button>
          </form>
          <Link href={`/agenda?data=${dateKey}&novo=1`} className="btn">+ Agendar</Link>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="card flex-1 overflow-x-auto p-0">
          <div className="grid min-w-[600px]" style={{ gridTemplateColumns: `64px repeat(${dentists.length}, minmax(180px, 1fr))` }}>
            <div className="sticky top-0 border-b border-slate-200 bg-white" />
            {dentists.map((d) => (
              <div key={d.id} className="border-b border-l border-slate-200 px-3 py-2 text-sm font-semibold">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}

            <div>
              {slots.map((s) => (
                <div key={s} className="border-b border-slate-100 pr-2 text-right text-xs text-slate-400" style={{ height: SLOT_PX }}>
                  {s}
                </div>
              ))}
            </div>
            {dentists.map((d) => (
              <div key={d.id} className="relative border-l border-slate-200">
                {slots.map((s) => (
                  <Link
                    key={s}
                    href={`/agenda?data=${dateKey}&novo=1&dentista=${d.id}&hora=${s}`}
                    className="block border-b border-slate-100 hover:bg-sky-50"
                    style={{ height: SLOT_PX }}
                    aria-label={`Agendar ${s} com ${d.name}`}
                  />
                ))}
                {appointments
                  .filter((a) => a.dentistId === d.id)
                  .map((a) => {
                    const height = Math.max(((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000 / SLOT_MIN) * SLOT_PX - 2, 22);
                    const inactive = a.status === "CANCELED" || a.status === "NO_SHOW";
                    return (
                      <Link
                        key={a.id}
                        href={`/agenda?data=${dateKey}&appt=${a.id}`}
                        className={`absolute inset-x-1 overflow-hidden rounded-md border-l-4 bg-white px-2 py-1 text-xs shadow-sm ring-1 ring-slate-200 hover:ring-sky-400 ${inactive ? "opacity-50" : ""}`}
                        style={{ top: top(a.startsAt) + 1, height, borderLeftColor: d.color }}
                      >
                        <p className="truncate font-medium">{fmtTime(a.startsAt)} {a.patient.name}</p>
                        <p className="truncate text-slate-500">{APPOINTMENT_STATUS[a.status].label}{a.notes && ` · ${a.notes}`}</p>
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>
          {dentists.length === 0 && <p className="p-6 text-sm text-slate-500">Cadastre dentistas em Usuários.</p>}
        </div>

        {(showForm || selectedAppt) && (
          <div className="w-full shrink-0 xl:w-96">
            {showForm && (
              <AppointmentForm
                date={dateKey}
                time={sp.hora}
                dentistId={defaultDentist}
                dentists={dentists}
                patient={preselected}
              />
            )}
            {!showForm && selectedAppt && (
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Consulta</h2>
                  <Link href={`/agenda?data=${dateKey}`} className="text-sm text-slate-500 hover:underline">Fechar</Link>
                </div>
                <div className="space-y-1 text-sm">
                  <Link href={`/pacientes/${selectedAppt.patientId}`} className="text-base font-medium text-sky-700 hover:underline">
                    {selectedAppt.patient.name}
                  </Link>
                  <p>{fmtTime(selectedAppt.startsAt)}–{fmtTime(selectedAppt.endsAt)} · {selectedAppt.dentist.name}</p>
                  {selectedAppt.patient.phone && <p>📞 {selectedAppt.patient.phone}</p>}
                  {selectedAppt.notes && <p className="text-slate-600">{selectedAppt.notes}</p>}
                  <StatusBadge status={APPOINTMENT_STATUS[selectedAppt.status]} />
                </div>
                {selectedAppt.patient.phone && ["SCHEDULED", "CONFIRMED"].includes(selectedAppt.status) && (
                  <a
                    href={whatsappLink(selectedAppt.patient.phone, selectedAppt.patient.name, selectedAppt.startsAt, selectedAppt.dentist.name)}
                    target="_blank"
                    className="btn-secondary w-full"
                  >
                    💬 Enviar confirmação por WhatsApp
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUS[selectedAppt.status].map((s) => (
                    <form key={s} action={setAppointmentStatus.bind(null, selectedAppt.id, s)}>
                      <button className={s === "CANCELED" || s === "NO_SHOW" ? "btn-secondary text-red-600" : "btn"}>
                        {APPOINTMENT_STATUS[s].label}
                      </button>
                    </form>
                  ))}
                </div>
                {user.role !== "RECEPTION" && (
                  <Link href={`/pacientes/${selectedAppt.patientId}?tab=evolucao`} className="block text-sm text-sky-700 hover:underline">
                    Abrir prontuário →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
