import { PatientForm } from "@/components/patient-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <h1 className="page-title">Novo paciente</h1>
      <PatientForm />
    </div>
  );
}
