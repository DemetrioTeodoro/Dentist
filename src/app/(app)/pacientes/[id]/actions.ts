"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import type { PaymentMethod, ToothStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ANAMNESIS_QUESTIONS, TOOTH_STATUS } from "@/lib/format";
import { uploadDir } from "@/lib/uploads";
import { audit, requireUser } from "@/lib/session";

const clinical = () => requireUser("ADMIN", "DENTIST");
const refresh = (patientId: string) => revalidatePath(`/pacientes/${patientId}`);
const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const money = (v: string) => Number(v.replace(",", ".")) || 0;

// ─── Anamnese ───────────────────────────────────────────────────────

export async function saveAnamnesis(patientId: string, formData: FormData) {
  const user = await clinical();
  const answers: Record<string, string> = {};
  ANAMNESIS_QUESTIONS.forEach((q, i) => {
    const answer = str(formData, `q${i}`);
    const detail = str(formData, `d${i}`);
    answers[q] = detail ? `${answer || "—"} (${detail})` : answer || "—";
  });

  const a = await db.anamnesis.create({
    data: {
      patientId,
      answers,
      allergies: str(formData, "allergies") || null,
      medications: str(formData, "medications") || null,
      alerts: str(formData, "alerts") || null,
      filledById: user.userId,
    },
  });
  await audit(user.userId, "anamnesis.create", "Anamnesis", a.id);
  refresh(patientId);
}

// ─── Odontograma ────────────────────────────────────────────────────

export async function saveTooth(
  patientId: string,
  data: { tooth: number; status: ToothStatus; faces: string; notes: string },
) {
  const user = await clinical();
  if (!(data.status in TOOTH_STATUS)) throw new Error("Situação inválida.");

  if (data.status === "HEALTHY" && !data.notes) {
    await db.toothRecord.deleteMany({ where: { patientId, tooth: data.tooth } });
  } else {
    const fields = { status: data.status, faces: data.faces || null, notes: data.notes || null };
    await db.toothRecord.upsert({
      where: { patientId_tooth: { patientId, tooth: data.tooth } },
      update: fields,
      create: { patientId, tooth: data.tooth, ...fields },
    });
  }
  await audit(user.userId, "odontogram.update", "Patient", patientId);
  refresh(patientId);
}

// ─── Evolução clínica ───────────────────────────────────────────────

export async function addClinicalNote(patientId: string, formData: FormData) {
  const user = await clinical();
  const content = str(formData, "content");
  if (!content) return;
  const note = await db.clinicalNote.create({
    data: {
      patientId,
      dentistId: user.userId,
      content,
      appointmentId: str(formData, "appointmentId") || null,
    },
  });
  await audit(user.userId, "note.create", "ClinicalNote", note.id);
  refresh(patientId);
}

// ─── Anexos ─────────────────────────────────────────────────────────

export async function uploadAttachment(patientId: string, formData: FormData) {
  const user = await clinical();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const storedName = `${randomUUID()}${path.extname(file.name).toLowerCase()}`;
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  const att = await db.attachment.create({
    data: {
      patientId,
      fileName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      description: str(formData, "description") || null,
      uploadedById: user.userId,
    },
  });
  await audit(user.userId, "attachment.create", "Attachment", att.id);
  refresh(patientId);
}

export async function deleteAttachment(patientId: string, id: string) {
  const user = await clinical();
  const att = await db.attachment.delete({ where: { id } });
  await unlink(path.join(uploadDir(), att.storedName)).catch(() => {});
  await audit(user.userId, "attachment.delete", "Attachment", id);
  refresh(patientId);
}

// ─── Planos de tratamento / orçamentos ──────────────────────────────

async function draftPlan(planId: string) {
  const plan = await db.treatmentPlan.findUniqueOrThrow({ where: { id: planId } });
  if (plan.status !== "DRAFT") throw new Error("Só é possível alterar orçamentos em elaboração.");
  return plan;
}

export async function createPlan(patientId: string, formData: FormData) {
  const user = await requireUser();
  const dentistId = str(formData, "dentistId") || user.userId;
  const plan = await db.treatmentPlan.create({ data: { patientId, dentistId } });
  await audit(user.userId, "plan.create", "TreatmentPlan", plan.id);
  refresh(patientId);
}

export async function addPlanItem(patientId: string, planId: string, formData: FormData) {
  await requireUser();
  await draftPlan(planId);
  const procedure = await db.procedure.findUniqueOrThrow({ where: { id: str(formData, "procedureId") } });
  const tooth = Number(str(formData, "tooth")) || null;
  const price = str(formData, "price");
  await db.treatmentItem.create({
    data: {
      planId,
      procedureId: procedure.id,
      tooth,
      faces: str(formData, "faces").toUpperCase() || null,
      price: price ? money(price) : procedure.price,
    },
  });
  refresh(patientId);
}

export async function removePlanItem(patientId: string, planId: string, itemId: string) {
  await requireUser();
  await draftPlan(planId);
  await db.treatmentItem.delete({ where: { id: itemId, planId } });
  refresh(patientId);
}

export async function updatePlanDetails(patientId: string, planId: string, formData: FormData) {
  await requireUser();
  await draftPlan(planId);
  await db.treatmentPlan.update({
    where: { id: planId },
    data: { discount: money(str(formData, "discount")), notes: str(formData, "notes") || null },
  });
  refresh(patientId);
}

// Aprovação gera as parcelas no contas a receber
export async function approvePlan(patientId: string, planId: string, formData: FormData) {
  const user = await requireUser();
  const plan = await draftPlan(planId);
  const items = await db.treatmentItem.findMany({ where: { planId } });
  if (items.length === 0) throw new Error("Adicione procedimentos antes de aprovar.");

  const total = items.reduce((s, i) => s + Number(i.price), 0) - Number(plan.discount);
  const installments = Math.max(1, Math.min(24, Number(str(formData, "installments")) || 1));
  const firstDue = new Date(str(formData, "firstDue") || new Date().toISOString().slice(0, 10));

  // Distribui centavos para que a soma das parcelas feche exatamente o total
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / installments);

  await db.$transaction([
    db.treatmentPlan.update({ where: { id: planId }, data: { status: "APPROVED", approvedAt: new Date() } }),
    ...Array.from({ length: installments }, (_, i) =>
      db.receivable.create({
        data: {
          patientId,
          planId,
          description: `Tratamento — parcela ${i + 1}/${installments}`,
          amount: (base + (i < cents % installments ? 1 : 0)) / 100,
          dueDate: addMonths(firstDue, i),
        },
      }),
    ),
  ]);
  await audit(user.userId, "plan.approve", "TreatmentPlan", planId);
  refresh(patientId);
}

export async function setPlanStatus(patientId: string, planId: string, status: "REJECTED" | "CANCELED") {
  const user = await requireUser();
  await db.$transaction([
    db.treatmentPlan.update({ where: { id: planId }, data: { status } }),
    // Parcelas ainda não pagas deixam de existir junto com o plano cancelado
    db.receivable.deleteMany({ where: { planId, paidAt: null } }),
  ]);
  await audit(user.userId, `plan.${status.toLowerCase()}`, "TreatmentPlan", planId);
  refresh(patientId);
}

// Executar um procedimento registra a evolução clínica e baixa do estoque os materiais cadastrados
export async function completeItem(patientId: string, itemId: string) {
  const user = await clinical();
  const item = await db.treatmentItem.findUniqueOrThrow({
    where: { id: itemId },
    include: { procedure: { include: { materials: true } }, plan: true },
  });
  if (item.plan.status !== "APPROVED") throw new Error("O plano precisa estar aprovado.");
  if (item.status === "DONE") return;

  const where = item.tooth ? ` — dente ${item.tooth}${item.faces ? ` (${item.faces})` : ""}` : "";
  await db.$transaction(async (tx) => {
    await tx.treatmentItem.update({
      where: { id: itemId },
      data: { status: "DONE", doneAt: new Date(), doneById: user.userId },
    });
    await tx.clinicalNote.create({
      data: { patientId, dentistId: user.userId, content: `Procedimento realizado: ${item.procedure.name}${where}.` },
    });
    for (const m of item.procedure.materials) {
      await tx.product.update({ where: { id: m.productId }, data: { stock: { decrement: m.quantity } } });
      await tx.stockMovement.create({
        data: {
          productId: m.productId,
          type: "PROCEDURE",
          quantity: m.quantity.negated(),
          treatmentItemId: itemId,
          userId: user.userId,
        },
      });
    }
    const pending = await tx.treatmentItem.count({ where: { planId: item.planId, status: "PENDING" } });
    if (pending === 0) await tx.treatmentPlan.update({ where: { id: item.planId }, data: { status: "COMPLETED" } });
  });
  refresh(patientId);
  if (item.procedure.materials.length) revalidatePath("/estoque");
}

// ─── Financeiro do paciente ─────────────────────────────────────────

export async function addReceivable(patientId: string, formData: FormData) {
  await requireUser("ADMIN", "RECEPTION");
  await db.receivable.create({
    data: {
      patientId,
      description: str(formData, "description") || "Lançamento avulso",
      amount: money(str(formData, "amount")),
      dueDate: new Date(str(formData, "dueDate")),
    },
  });
  refresh(patientId);
  revalidatePath("/financeiro");
}

export async function payReceivable(patientId: string, id: string, formData: FormData) {
  const user = await requireUser("ADMIN", "RECEPTION");
  await db.receivable.update({
    where: { id, paidAt: null },
    data: { paidAt: new Date(), method: str(formData, "method") as PaymentMethod },
  });
  await audit(user.userId, "receivable.pay", "Receivable", id);
  refresh(patientId);
  revalidatePath("/financeiro");
}

export async function undoPayment(patientId: string, id: string) {
  const user = await requireUser("ADMIN");
  await db.receivable.update({ where: { id }, data: { paidAt: null, method: null } });
  await audit(user.userId, "receivable.undo", "Receivable", id);
  refresh(patientId);
  revalidatePath("/financeiro");
}
