"use client";

export function PrintButton() {
  return (
    <button className="btn print:hidden" onClick={() => window.print()}>
      🖨️ Imprimir / salvar PDF
    </button>
  );
}
