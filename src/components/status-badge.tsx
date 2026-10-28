export function StatusBadge({ status }: { status: { label: string; cls: string } }) {
  return <span className={`badge ${status.cls}`}>{status.label}</span>;
}
