import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { audit, getSession } from "@/lib/session";
import { uploadDir } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "RECEPTION") return new Response("Não autorizado", { status: 403 });

  const { id } = await params;
  const att = await db.attachment.findUnique({ where: { id } });
  if (!att) return new Response("Não encontrado", { status: 404 });

  const data = await readFile(path.join(uploadDir(), att.storedName));
  await audit(session.userId, "attachment.view", "Attachment", id);
  return new Response(data, {
    headers: {
      "Content-Type": att.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(att.fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
