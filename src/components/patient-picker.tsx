"use client";

import { useEffect, useState } from "react";
import { searchPatients } from "@/app/(app)/agenda/actions";

type Option = { id: string; name: string; phone: string | null };

// Campo de busca de paciente que envia o id selecionado num input hidden
export function PatientPicker({ name, initial }: { name: string; initial?: Option | null }) {
  const [query, setQuery] = useState(initial?.name ?? "");
  const [selected, setSelected] = useState<Option | null>(initial ?? null);
  const [options, setOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (selected && query === selected.name) return;
    const t = setTimeout(() => searchPatients(query).then(setOptions), 250);
    return () => clearTimeout(t);
  }, [query, selected]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <input
        className="input"
        value={query}
        placeholder="Digite o nome ou CPF"
        onChange={(e) => {
          setQuery(e.target.value);
          setSelected(null);
        }}
      />
      {!selected && options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                onClick={() => {
                  setSelected(o);
                  setQuery(o.name);
                  setOptions([]);
                }}
              >
                {o.name} <span className="text-xs text-slate-500">{o.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
