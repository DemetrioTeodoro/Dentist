"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createAppointment } from "@/app/(app)/agenda/actions";
import { PatientPicker } from "./patient-picker";

type Props = {
  date: string;
  time?: string;
  dentistId?: string;
  dentists: { id: string; name: string }[];
  patient?: { id: string; name: string; phone: string | null } | null;
};

export function AppointmentForm({ date, time, dentistId, dentists, patient }: Props) {
  const [error, action, pending] = useActionState(createAppointment, null);

  return (
    <form action={action} className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Novo agendamento</h2>
        <Link href={`/agenda?data=${date}`} className="text-sm text-slate-500 hover:underline">Fechar</Link>
      </div>
      <div>
        <label className="label">Paciente</label>
        <PatientPicker name="patientId" initial={patient} />
        <Link href="/pacientes/novo" className="mt-1 inline-block text-xs text-sky-700 hover:underline">
          + cadastrar novo paciente
        </Link>
      </div>
      <div>
        <label className="label">Dentista</label>
        <select className="input" name="dentistId" defaultValue={dentistId}>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Data</label>
          <input className="input" type="date" name="date" defaultValue={date} required />
        </div>
        <div>
          <label className="label">Horário</label>
          <input className="input" type="time" name="time" defaultValue={time} step={900} required />
        </div>
        <div>
          <label className="label">Duração</label>
          <select className="input" name="duration" defaultValue="30">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Observações</label>
        <input className="input" name="notes" placeholder="Ex.: avaliação, dor no dente 36" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={pending}>{pending ? "Salvando..." : "Agendar"}</button>
    </form>
  );
}
