import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Clock,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActionPlan, generateActionPlan, updateActionStep } from "@/lib/citizen.functions";
import type { ActionPlan, ActionStep } from "@/lib/action-plan";
import { toast } from "sonner";

const TYPE_ICON = {
  document: FileText,
  visit: MapPin,
  apply: Send,
  verify: ShieldCheck,
  wait: Clock,
} as const;

const WHEN_LABEL: Record<ActionStep["when"], string> = {
  today: "Today",
  next: "Next",
  later: "Later",
};

const WHEN_COLOR: Record<ActionStep["when"], string> = {
  today: "var(--saffron)",
  next: "var(--trust)",
  later: "var(--muted-foreground)",
};

export function ActionPlanCard({ schemeId, enabled = true }: { schemeId: string; enabled?: boolean }) {
  const qc = useQueryClient();
  const getPlan = useServerFn(getActionPlan);
  const genPlan = useServerFn(generateActionPlan);
  const updateStep = useServerFn(updateActionStep);

  const q = useQuery({
    queryKey: ["action-plan", schemeId],
    queryFn: () => getPlan({ data: { scheme_id: schemeId } }),
    enabled,
  });

  const genMut = useMutation({
    mutationFn: (force: boolean) => genPlan({ data: { scheme_id: schemeId, force } }),
    onSuccess: (res) => {
      qc.setQueryData(["action-plan", schemeId], { plan: res.plan });
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Your action plan is ready.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not build a plan."),
  });

  const stepMut = useMutation({
    mutationFn: (v: { step_no: number; status: ActionStep["status"] }) =>
      updateStep({ data: { scheme_id: schemeId, ...v } }),
    onSuccess: (res) => {
      qc.setQueryData(["action-plan", schemeId], { plan: res.plan });
    },
  });

  const plan: ActionPlan | null = q.data?.plan ?? null;

  if (q.isLoading) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your action plan…
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-6 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)]">
          <Sparkles className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Get your step-by-step plan
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          SAARTHI will lay out what to do today, next, and later — in plain language.
        </p>
        <Button
          className="mt-4 rounded-full"
          onClick={() => genMut.mutate(false)}
          disabled={genMut.isPending}
        >
          {genMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Build my action plan
        </Button>
      </div>
    );
  }

  const done = plan.steps.filter((s) => s.status === "done").length;
  const total = plan.steps.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--saffron)]">SAARTHI action plan</p>
          <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Your next steps
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {done} of {total} done · one small step at a time.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-xs"
          onClick={() => genMut.mutate(true)}
          disabled={genMut.isPending}
        >
          {genMut.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Regenerate
        </Button>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[var(--success)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-5 space-y-3">
        {plan.steps.map((s) => {
          const Icon = TYPE_ICON[s.type] ?? Sparkles;
          const isDone = s.status === "done";
          const isSkipped = s.status === "skipped";
          return (
            <li
              key={s.step_no}
              className={`rounded-2xl border border-border/60 p-4 transition ${
                isDone ? "bg-[color-mix(in_oklch,var(--success)_8%,transparent)]" : "bg-background"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    stepMut.mutate({ step_no: s.step_no, status: isDone ? "todo" : "done" })
                  }
                  aria-label={isDone ? "Mark step as not done" : "Mark step as done"}
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                    isDone
                      ? "border-[var(--success)] bg-[var(--success)] text-white"
                      : "border-border bg-background text-muted-foreground hover:border-[var(--trust)]"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <span className="text-xs">{s.step_no}</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{
                        color: WHEN_COLOR[s.when],
                        backgroundColor: `color-mix(in oklch, ${WHEN_COLOR[s.when]} 15%, transparent)`,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                      {WHEN_LABEL[s.when]}
                    </span>
                    {s.estimated_time && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {s.estimated_time}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-sm font-medium ${
                      isDone ? "text-muted-foreground line-through" : "text-foreground"
                    } ${isSkipped ? "text-muted-foreground" : ""}`}
                  >
                    {s.title}
                  </p>
                  {s.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                  )}
                  {s.location && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {s.location.startsWith("http") ? (
                        <a
                          href={s.location}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[var(--trust)] hover:underline"
                        >
                          {s.location}
                        </a>
                      ) : (
                        s.location
                      )}
                    </p>
                  )}
                  {!isDone && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => stepMut.mutate({ step_no: s.step_no, status: "done" })}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--success)]/40 bg-[color-mix(in_oklch,var(--success)_10%,transparent)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--success)] hover:bg-[color-mix(in_oklch,var(--success)_18%,transparent)]"
                      >
                        <Check className="h-3 w-3" /> Completed
                      </button>
                      <button
                        onClick={() => stepMut.mutate({ step_no: s.step_no, status: "skipped" })}
                        className={`rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted ${
                          isSkipped ? "bg-muted" : ""
                        }`}
                      >
                        {isSkipped ? "Skipped" : "Skip"}
                      </button>
                    </div>
                  )}
                  {isDone && (
                    <div className="mt-2">
                      <button
                        onClick={() => stepMut.mutate({ step_no: s.step_no, status: "todo" })}
                        className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted"
                      >
                        Mark as not done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}