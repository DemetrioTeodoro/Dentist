import Link from "next/link";
import { db } from "@/lib/db";
import { age, fmtDateOnly } from "@/lib/format";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();

  const patients = await db.patient.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { cpf: { contains: term } },
            { phone: { contains: term } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Pacientes</h1>
        <Link href="/pacientes/novo" className="btn">+ Novo paciente</Link>
      </div>

      <form className="flex max-w-md gap-2">
        <input className="input" name="q" defaultValue={term} placeholder="Buscar por nome, CPF ou telefone" />
        <button className="btn-secondary">Buscar</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Nascimento</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/pacientes/${p.id}`} className="font-medium text-sky-700 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td>{p.cpf ?? "—"}</td>
                <td>{p.phone ?? "—"}</td>
                <td>{p.birthDate ? `${fmtDateOnly(p.birthDate)} (${age(p.birthDate)} anos)` : "—"}</td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">Nenhum paciente encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
