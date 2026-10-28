"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, requireUser } from "@/lib/session";

const optional = z
  .string()
  .trim()
  .transform((v) => v || null);

const patientSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  cpf: optional,
  birthDate: optional.transform((v) => (v ? new Date(v) : null)),
  gender: optional,
  phone: optional,
  email: optional.pipe(z.email("E-mail inválido.").nullable()),
  address: optional,
  responsible: optional,
  notes: optional,
});

export async function savePatient(id: string | null, _prev: string | null, formData: FormData) {
  const user = await requireUser();
  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  if (parsed.data.cpf) {
    const dup = await db.patient.findFirst({ where: { cpf: parsed.data.cpf, NOT: id ? { id } : undefined } });
    if (dup) return "Já existe um paciente com este CPF.";
  }

  const patient = id
    ? await db.patient.update({ where: { id }, data: parsed.data })
    : await db.patient.create({ data: parsed.data });
  await audit(user.userId, id ? "patient.update" : "patient.create", "Patient", patient.id);

  revalidatePath("/pacientes");
  redirect(`/pacientes/${patient.id}`);
}
