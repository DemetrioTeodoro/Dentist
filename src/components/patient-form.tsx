"use client";

import { useActionState } from "react";
import type { Patient } from "@prisma/client";
import { savePatient } from "@/app/(app)/pacientes/actions";
import { isoDateOnly } from "@/lib/format";

export function PatientForm({ patient }: { patient?: Patient }) {
  const [error, action, pending] = useActionState(savePatient.bind(null, patient?.id ?? null), null);

  return (
    <form action={action} className="card grid max-w-3xl gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Nome completo *</label>
        <input className="input" name="name" defaultValue={patient?.name} required />
      </div>
      <div>
        <label className="label">CPF</label>
        <input className="input" name="cpf" defaultValue={patient?.cpf ?? ""} placeholder="000.000.000-00" />
      </div>
      <div>
        <label className="label">Data de nascimento</label>
        <input
          className="input"
          type="date"
          name="birthDate"
          defaultValue={patient?.birthDate ? isoDateOnly(patient.birthDate) : ""}
        />
      </div>
      <div>
        <label className="label">Sexo</label>
        <select className="input" name="gender" defaultValue={patient?.gender ?? ""}>
          <option value="">—</option>
          <option>Feminino</option>
          <option>Masculino</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label className="label">Telefone / WhatsApp</label>
        <input className="input" name="phone" defaultValue={patient?.phone ?? ""} />
      </div>
      <div>
        <label className="label">E-mail</label>
        <input className="input" name="email" type="email" defaultValue={patient?.email ?? ""} />
      </div>
      <div>
        <label className="label">Responsável (menores)</label>
        <input className="input" name="responsible" defaultValue={patient?.responsible ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Endereço</label>
        <input className="input" name="address" defaultValue={patient?.address ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Observações</label>
        <textarea className="input" name="notes" rows={3} defaultValue={patient?.notes ?? ""} />
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button className="btn" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  );
}
