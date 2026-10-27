import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Money = number | string | { toString(): string };

export const toNumber = (v: Money) => Number(v.toString());

export const brl = (v: Money) =>
  toNumber(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (d: Date | string) => format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
export const fmtDateTime = (d: Date | string) =>
  format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
export const fmtTime = (d: Date | string) => format(new Date(d), "HH:mm", { locale: ptBR });

// Campos @db.Date voltam como meia-noite UTC; usar UTC evita mostrar o dia anterior
export const fmtDateOnly = (d: Date | string) => {
  const date = new Date(d);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
};
export const isoDateOnly = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export function age(birthDate: Date | string | null) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getUTCFullYear();
  if (now.getMonth() < b.getUTCMonth() || (now.getMonth() === b.getUTCMonth() && now.getDate() < b.getUTCDate())) a--;
  return a;
}

export const ROLE_LABEL = { ADMIN: "Administrador", DENTIST: "Dentista", RECEPTION: "Recepção" } as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: { label: "Agendado", cls: "bg-slate-100 text-slate-700" },
  CONFIRMED: { label: "Confirmado", cls: "bg-blue-100 text-blue-700" },
  ARRIVED: { label: "Aguardando", cls: "bg-amber-100 text-amber-800" },
  IN_PROGRESS: { label: "Em atendimento", cls: "bg-violet-100 text-violet-700" },
  DONE: { label: "Atendido", cls: "bg-emerald-100 text-emerald-700" },
  NO_SHOW: { label: "Faltou", cls: "bg-red-100 text-red-700" },
  CANCELED: { label: "Cancelado", cls: "bg-zinc-200 text-zinc-500 line-through" },
} as const;

export const PLAN_STATUS = {
  DRAFT: { label: "Orçamento", cls: "bg-slate-100 text-slate-700" },
  APPROVED: { label: "Aprovado", cls: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Recusado", cls: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Concluído", cls: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "Cancelado", cls: "bg-zinc-200 text-zinc-500" },
} as const;

export const PAYMENT_METHOD = {
  CASH: "Dinheiro",
  PIX: "PIX",
  DEBIT: "Cartão de débito",
  CREDIT: "Cartão de crédito",
  TRANSFER: "Transferência",
  INSURANCE: "Convênio",
} as const;

export const TOOTH_STATUS = {
  HEALTHY: { label: "Hígido", fill: "#ffffff" },
  CARIES: { label: "Cárie", fill: "#ef4444" },
  RESTORED: { label: "Restaurado", fill: "#3b82f6" },
  ENDODONTIC: { label: "Canal tratado", fill: "#f59e0b" },
  CROWN: { label: "Coroa", fill: "#a855f7" },
  IMPLANT: { label: "Implante", fill: "#14b8a6" },
  FRACTURED: { label: "Fraturado", fill: "#f97316" },
  EXTRACTION_INDICATED: { label: "Extração indicada", fill: "#fca5a5" },
  MISSING: { label: "Ausente", fill: "#d4d4d8" },
} as const;

export const ANAMNESIS_QUESTIONS = [
  "Está em tratamento médico atualmente?",
  "Faz uso de anticoagulantes?",
  "Tem hipertensão?",
  "Tem diabetes?",
  "Tem problemas cardíacos?",
  "Já teve reação à anestesia?",
  "Está grávida ou amamentando?",
  "É fumante?",
  "Tem sangramento gengival frequente?",
  "Sente sensibilidade nos dentes?",
  "Range ou aperta os dentes (bruxismo)?",
] as const;

// Quantidades de estoque: até 2 casas, sem zeros à direita
export const fmtQty = (v: Money) => toNumber(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export const STOCK_MOVE_TYPE = {
  IN: { label: "Entrada", cls: "bg-emerald-100 text-emerald-700" },
  OUT: { label: "Saída", cls: "bg-orange-100 text-orange-700" },
  ADJUST: { label: "Ajuste", cls: "bg-slate-100 text-slate-700" },
  PROCEDURE: { label: "Procedimento", cls: "bg-violet-100 text-violet-700" },
} as const;
