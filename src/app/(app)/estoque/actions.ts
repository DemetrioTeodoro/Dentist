"use server";

import { revalidatePath } from "next/cache";
import type { StockMoveType } from "@prisma/client";
import { db } from "@/lib/db";
import { audit, requireUser } from "@/lib/session";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const qty = (v: string) => Number(v.replace(",", ".")) || 0;

export async function saveProduct(formData: FormData) {
  await requireUser("ADMIN", "DENTIST");
  const id = str(formData, "id");
  const data = {
    name: str(formData, "name"),
    unit: str(formData, "unit") || "un",
    minStock: qty(str(formData, "minStock")),
  };
  if (!data.name) return;
  if (id) await db.product.update({ where: { id }, data });
  else await db.product.create({ data });
  revalidatePath("/estoque");
}

export async function toggleProduct(id: string, active: boolean) {
  await requireUser("ADMIN");
  await db.product.update({ where: { id }, data: { active } });
  revalidatePath("/estoque");
}

// Entrada, saída ou ajuste manual; o ajuste informa o saldo contado, não a diferença
export async function moveStock(formData: FormData) {
  const user = await requireUser();
  const productId = str(formData, "productId");
  const type = str(formData, "type") as StockMoveType;
  const value = qty(str(formData, "quantity"));
  if (!["IN", "OUT", "ADJUST"].includes(type)) throw new Error("Movimentação inválida.");

  await db.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
    const delta = type === "IN" ? Math.abs(value) : type === "OUT" ? -Math.abs(value) : value - Number(product.stock);
    if (delta === 0) return;
    await tx.product.update({ where: { id: productId }, data: { stock: { increment: delta } } });
    const move = await tx.stockMovement.create({
      data: { productId, type, quantity: delta, notes: str(formData, "notes") || null, userId: user.userId },
    });
    await audit(user.userId, `stock.${type.toLowerCase()}`, "StockMovement", move.id);
  });
  revalidatePath("/estoque");
}

// ─── Materiais consumidos por procedimento ──────────────────────────

export async function saveProcedureMaterial(procedureId: string, formData: FormData) {
  await requireUser("ADMIN", "DENTIST");
  const productId = str(formData, "productId");
  const quantity = qty(str(formData, "quantity"));
  if (!productId || quantity <= 0) return;
  await db.procedureMaterial.upsert({
    where: { procedureId_productId: { procedureId, productId } },
    update: { quantity },
    create: { procedureId, productId, quantity },
  });
  revalidatePath(`/procedimentos/${procedureId}`);
}

export async function removeProcedureMaterial(procedureId: string, id: string) {
  await requireUser("ADMIN", "DENTIST");
  await db.procedureMaterial.delete({ where: { id, procedureId } });
  revalidatePath(`/procedimentos/${procedureId}`);
}
