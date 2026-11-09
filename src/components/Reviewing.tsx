export function Reviewing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 border border-rule bg-white px-4 py-3 text-[13px] text-ink-muted" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
