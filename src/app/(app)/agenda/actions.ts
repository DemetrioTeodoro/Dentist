"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { APPOINTMENT_STATUS } from "@/lib/format";
import { requireUser } from "@/lib/session";

export async function searchPatients(q: string) {
  await requireUser();
  if (q.trim().length < 2) return [];
  return db.patient.findMany({
    where: {
      active: true,
      OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { cpf: { contains: q.trim() } }],
    },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
    take: 8,
  });
}

export async function createAppointment(_prev: string | null, formData: FormData) {
  await requireUser();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const patientId = get("patientId");
  const dentistId = get("dentistId");
  const date = get("date");
  if (!patientId) return "Selecione o paciente.";
  if (!dentistId || !date || !get("time")) return "Preencha dentista, data e horário.";

  const startsAt = new Date(`${date}T${get("time")}`);
  const endsAt = new Date(startsAt.getTime() + Number(get("duration") || 30) * 60_000);

  const conflict = await db.appointment.findFirst({
    where: {
      dentistId,
      status: { notIn: ["CANCELED", "NO_SHOW"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    include: { patient: { select: { name: true } } },
  });
  if (conflict) return `Conflito de horário com ${conflict.patient.name}.`;

  await db.appointment.create({
    data: { patientId, dentistId, startsAt, endsAt, notes: get("notes") || null },
  });
  revalidatePath("/agenda");
  redirect(`/agenda?data=${date}`);
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  await requireUser();
  if (!(status in APPOINTMENT_STATUS)) throw new Error("Status inválido.");
  await db.appointment.update({ where: { id }, data: { status } });
  revalidatePath("/agenda");
  revalidatePath("/");
}
