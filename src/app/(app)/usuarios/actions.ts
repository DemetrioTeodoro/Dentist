"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function saveUser(_prev: string | null, formData: FormData) {
  const me = await requireUser("ADMIN");
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const id = get("id");
  const password = get("password");
  const email = get("email").toLowerCase();

  if (!id && password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  if (password && password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  const dup = await db.user.findFirst({ where: { email, NOT: id ? { id } : undefined } });
  if (dup) return "Já existe um usuário com este e-mail.";

  const role = get("role") as Role;
  if (id === me.userId && role !== "ADMIN") return "Você não pode remover seu próprio acesso de administrador.";

  const data = {
    name: get("name"),
    email,
    role,
    cro: get("cro") || null,
    color: get("color") || "#0ea5e9",
    commissionPct: Number(get("commissionPct")) || 0,
    active: id ? formData.get("active") === "on" : true,
    ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
  };

  if (id) await db.user.update({ where: { id }, data });
  else await db.user.create({ data: { ...data, passwordHash: data.passwordHash! } });
  revalidatePath("/usuarios");
  return null;
}
