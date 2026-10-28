import { notFound } from "next/navigation";
import { PatientForm } from "@/components/patient-form";
import { db } from "@/lib/db";

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await db.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <h1 className="page-title">Editar paciente</h1>
      <PatientForm patient={patient} />
    </div>
  );
}
