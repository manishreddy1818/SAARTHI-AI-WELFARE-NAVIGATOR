import {
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Sprout,
  UserCircle2,
  Wallet,
  Accessibility,
} from "lucide-react";

export type LifeEventKey =
  | "education"
  | "agriculture"
  | "senior"
  | "women_child"
  | "employment"
  | "housing"
  | "disability"
  | "financial";

export const LIFE_EVENTS: {
  key: LifeEventKey;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "education", label: "Education", icon: GraduationCap, prompt: "I need help with education or scholarships." },
  { key: "agriculture", label: "Agriculture", icon: Sprout, prompt: "I work in farming and want to know what support I can get." },
  { key: "senior", label: "Senior Citizen", icon: UserCircle2, prompt: "I am a senior citizen looking for pensions and healthcare help." },
  { key: "women_child", label: "Women & Child", icon: Heart, prompt: "I need help for women and child welfare schemes." },
  { key: "employment", label: "Employment", icon: Briefcase, prompt: "I'm looking for employment support, skill training or Mudra loan help." },
  { key: "housing", label: "Housing", icon: Home, prompt: "I need help with housing schemes like PMAY." },
  { key: "disability", label: "Disability Support", icon: Accessibility, prompt: "I or a family member has a disability. What support can we get?" },
  { key: "financial", label: "Financial Assistance", icon: Wallet, prompt: "I need financial assistance for my family." },
];

export function LifeEventsGrid({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Not sure where to start?
      </p>
      <p className="mt-1 text-sm text-foreground">
        Pick a life area — SAARTHI will guide the conversation. You can also skip this and just
        start talking.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LIFE_EVENTS.map((e) => (
          <button
            key={e.key}
            onClick={() => onPick(e.prompt)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-background p-3 text-center text-xs font-medium transition hover:-translate-y-0.5 hover:border-[var(--trust)] hover:shadow-sm"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-[var(--trust)] group-hover:bg-[var(--trust)] group-hover:text-primary-foreground">
              <e.icon className="h-4 w-4" />
            </span>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}