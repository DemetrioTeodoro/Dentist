import { deleteAttachment, uploadAttachment } from "@/app/(app)/pacientes/[id]/actions";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

export async function AttachmentsTab({ patientId }: { patientId: string }) {
  const files = await db.attachment.findMany({
    where: { patientId },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <form action={uploadAttachment.bind(null, patientId)} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Arquivo (radiografia, foto, documento)</label>
          <input className="text-sm" type="file" name="file" required accept="image/*,application/pdf" />
        </div>
        <div className="min-w-60 flex-1">
          <label className="label">Descrição</label>
          <input className="input" name="description" placeholder="Ex.: Panorâmica inicial" />
        </div>
        <button className="btn">Enviar</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {files.map((f) => (
          <div key={f.id} className="card space-y-2 p-3">
            <a href={`/api/anexos/${f.id}`} target="_blank" className="block">
              {f.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/anexos/${f.id}`} alt={f.fileName} className="h-40 w-full rounded-md bg-slate-100 object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-md bg-slate-100 text-4xl">📄</div>
              )}
            </a>
            <p className="truncate text-sm font-medium">{f.description || f.fileName}</p>
            <p className="text-xs text-slate-500">{fmtDateTime(f.createdAt)} · {f.uploadedBy.name}</p>
            <form action={deleteAttachment.bind(null, patientId, f.id)}>
              <button className="text-xs text-red-600 hover:underline">Excluir</button>
            </form>
          </div>
        ))}
      </div>
      {files.length === 0 && <p className="text-sm text-slate-500">Nenhum arquivo enviado.</p>}
    </div>
  );
}
