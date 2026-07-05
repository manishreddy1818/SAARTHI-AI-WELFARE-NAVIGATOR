export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    need_documents: { label: "Need documents", color: "var(--saffron)" },
    application_submitted: { label: "Application submitted", color: "var(--trust)" },
    waiting_approval: { label: "Waiting approval", color: "oklch(0.65 0.15 260)" },
    benefit_received: { label: "Benefit received", color: "oklch(0.62 0.15 155)" },
    completed: { label: "Completed", color: "oklch(0.55 0.12 155)" },
  };
  const s = map[status] ?? { label: status, color: "var(--muted-foreground)" };
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: s.color,
        backgroundColor: `color-mix(in oklch, ${s.color} 14%, transparent)`,
      }}
    >
      {s.label}
    </span>
  );
}