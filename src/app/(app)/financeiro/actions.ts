"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function addExpense(formData: FormData) {
  await requireUser("ADMIN", "RECEPTION");
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  await db.expense.create({
    data: {
      description: get("description"),
      category: get("category") || "Outros",
      amount: Number(get("amount").replace(",", ".")),
      date: new Date(get("date")),
    },
  });
  revalidatePath("/financeiro");
}

export async function deleteExpense(id: string) {
  await requireUser("ADMIN");
  await db.expense.delete({ where: { id } });
  revalidatePath("/financeiro");
}
