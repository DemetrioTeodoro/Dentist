"use client";

import { useState, useTransition } from "react";
import type { ToothStatus } from "@prisma/client";
import { saveTooth } from "@/app/(app)/pacientes/[id]/actions";
import { TOOTH_STATUS } from "@/lib/format";

type ToothData = { tooth: number; status: ToothStatus; faces: string | null; notes: string | null };

// Numeração FDI, na ordem em que aparece para quem olha de frente para o paciente
const PERMANENT = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];
const DECIDUOUS = [
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
];

const FACES = [
  { key: "V", label: "Vestibular" },
  { key: "L", label: "Lingual/Palatina" },
  { key: "M", label: "Mesial" },
  { key: "D", label: "Distal" },
  { key: "O", label: "Oclusal/Incisal" },
];

// Status que se aplicam a faces específicas; os demais pintam o dente inteiro
const FACE_STATUSES: ToothStatus[] = ["CARIES", "RESTORED"];

const S = 36; // tamanho do dente no SVG
const I = 11; // recuo do quadrado central

function ToothSvg({ tooth, data, selected }: { tooth: number; data?: ToothData; selected: boolean }) {
  const quadrant = Math.floor(tooth / 10);
  const upper = [1, 2, 5, 6].includes(quadrant);
  const rightSide = [1, 4, 5, 8].includes(quadrant); // lado direito do paciente = esquerda da tela

  // Posição de cada face no desenho depende da arcada e do lado
  const pos = {
    top: upper ? "V" : "L",
    bottom: upper ? "L" : "V",
    left: rightSide ? "D" : "M",
    right: rightSide ? "M" : "D",
    center: "O",
  } as const;

  const status = data?.status ?? "HEALTHY";
  const fill = TOOTH_STATUS[status].fill;
  const faces = data?.faces ?? "";
  const byFace = FACE_STATUSES.includes(status) && faces.length > 0;
  const color = (face: string) => (byFace ? (faces.includes(face) ? fill : "#fff") : fill);

  const polys = {
    top: `0,0 ${S},0 ${S - I},${I} ${I},${I}`,
    bottom: `0,${S} ${S},${S} ${S - I},${S - I} ${I},${S - I}`,
    left: `0,0 ${I},${I} ${I},${S - I} 0,${S}`,
    right: `${S},0 ${S - I},${I} ${S - I},${S - I} ${S},${S}`,
    center: `${I},${I} ${S - I},${I} ${S - I},${S - I} ${I},${S - I}`,
  };

  return (
    <svg width={S} height={S} viewBox={`-1 -1 ${S + 2} ${S + 2}`} className={selected ? "drop-shadow-[0_0_3px_#0284c7]" : ""}>
      {(Object.keys(polys) as (keyof typeof polys)[]).map((k) => (
        <polygon key={k} points={polys[k]} fill={color(pos[k])} stroke={selected ? "#0284c7" : "#64748b"} strokeWidth={selected ? 2 : 1} />
      ))}
      {(status === "MISSING" || status === "EXTRACTION_INDICATED") && (
        <g stroke={status === "MISSING" ? "#52525b" : "#dc2626"} strokeWidth={2.5}>
          <line x1={2} y1={2} x2={S - 2} y2={S - 2} />
          <line x1={S - 2} y1={2} x2={2} y2={S - 2} />
        </g>
      )}
    </svg>
  );
}

export function Odontogram({ patientId, teeth, readOnly }: { patientId: string; teeth: ToothData[]; readOnly?: boolean }) {
  const [deciduous, setDeciduous] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const byTooth = new Map(teeth.map((t) => [t.tooth, t]));
  const current = selected ? byTooth.get(selected) : undefined;

  const [form, setForm] = useState({ status: "HEALTHY" as ToothStatus, faces: "", notes: "" });

  function select(tooth: number) {
    if (readOnly) return;
    const t = byTooth.get(tooth);
    setSelected(tooth);
    setForm({ status: t?.status ?? "HEALTHY", faces: t?.faces ?? "", notes: t?.notes ?? "" });
  }

  function toggleFace(face: string) {
    setForm((f) => ({ ...f, faces: f.faces.includes(face) ? f.faces.replace(face, "") : f.faces + face }));
  }

  function save() {
    if (!selected) return;
    startTransition(async () => {
      const faces = FACE_STATUSES.includes(form.status) ? form.faces : "";
      await saveTooth(patientId, { tooth: selected, ...form, faces });
      setSelected(null);
    });
  }

  const rows = deciduous ? DECIDUOUS : PERMANENT;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className={deciduous ? "btn-secondary" : "btn"} onClick={() => setDeciduous(false)}>Permanentes</button>
        <button className={deciduous ? "btn" : "btn-secondary"} onClick={() => setDeciduous(true)}>Decíduos</button>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block space-y-6 rounded-lg border border-slate-200 bg-white p-4">
          {rows.map((row, r) => (
            <div key={r} className="flex gap-1">
              {row.map((tooth, i) => (
                <button
                  key={tooth}
                  type="button"
                  onClick={() => select(tooth)}
                  title={byTooth.get(tooth)?.notes ?? undefined}
                  className={`flex flex-col items-center gap-0.5 ${i === row.length / 2 ? "ml-4" : ""} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                >
                  {r === 0 && <span className="text-[10px] text-slate-500">{tooth}</span>}
                  <ToothSvg tooth={tooth} data={byTooth.get(tooth)} selected={selected === tooth} />
                  {r === 1 && <span className="text-[10px] text-slate-500">{tooth}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {Object.entries(TOOTH_STATUS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border border-slate-400" style={{ background: v.fill }} />
            {v.label}
          </span>
        ))}
      </div>

      {selected && (
        <div className="card max-w-xl space-y-3 border-sky-200">
          <h3 className="font-semibold">Dente {selected}</h3>
          <div>
            <label className="label">Situação</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ToothStatus })}
            >
              {Object.entries(TOOTH_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          {FACE_STATUSES.includes(form.status) && (
            <div>
              <label className="label">Faces afetadas</label>
              <div className="flex flex-wrap gap-3 text-sm">
                {FACES.map((f) => (
                  <label key={f.key} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.faces.includes(f.key)} onChange={() => toggleFace(f.key)} />
                    {f.label} ({f.key})
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label">Observações</label>
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className="btn" onClick={save} disabled={pending}>{pending ? "Salvando..." : "Salvar"}</button>
            <button className="btn-secondary" onClick={() => setSelected(null)}>Cancelar</button>
          </div>
          {current && <p className="text-xs text-slate-500">Situação atual: {TOOTH_STATUS[current.status].label}</p>}
        </div>
      )}
    </div>
  );
}
