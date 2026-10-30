"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function saveProcedure(formData: FormData) {
  await requireUser("ADMIN");
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const id = get("id");
  const data = {
    name: get("name"),
    code: get("code") || null,
    price: Number(get("price").replace(",", ".")),
    durationMin: Number(get("durationMin")) || 30,
  };
  if (id) await db.procedure.update({ where: { id }, data });
  else await db.procedure.create({ data });
  revalidatePath("/procedimentos");
}

export async function toggleProcedure(id: string, active: boolean) {
  await requireUser("ADMIN");
  await db.procedure.update({ where: { id }, data: { active } });
  revalidatePath("/procedimentos");
}
