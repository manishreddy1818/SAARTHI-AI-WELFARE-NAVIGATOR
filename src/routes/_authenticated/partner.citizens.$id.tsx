import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Loader2, Save, Trash2 } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemeCard } from "@/components/scheme-card";
import { AiSummaryCard, buildAiSummary } from "@/components/ai-summary-card";
import { lazy, Suspense } from "react";
import { RecoveryState } from "@/components/recovery-state";

// Lazy-load the print-styled report (heavy JSX + print CSS) so it doesn't
// weigh down the initial detail-page bundle.
const WelfareReport = lazy(() =>
  import("@/components/welfare-report").then((m) => ({ default: m.WelfareReport })),
);
import {
  deletePartnerCitizen,
  getPartnerCitizen,
  updateFollowUp,
} from "@/lib/partner.functions";
import { StatusBadge } from "@/components/partner-status-badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/partner/citizens/$id")({
  head: () => ({
    meta: [
      { title: "Citizen — SAARTHI Partner" },
      { name: "description", content: "Recommendations and follow-up for a citizen." },
    ],
  }),
  component: CitizenDetail,
});

const STAGES = [
  { key: "need_documents", label: "Need Documents" },
  { key: "application_submitted", label: "Application Submitted" },
  { key: "waiting_approval", label: "Waiting Approval" },
  { key: "benefit_received", label: "Benefit Received" },
  { key: "completed", label: "Completed" },
] as const;

function CitizenDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const getFn = useServerFn(getPartnerCitizen);
  const updFn = useServerFn(updateFollowUp);
  const delFn = useServerFn(deletePartnerCitizen);
  const q = useQuery({ queryKey: ["partner-citizen", id], queryFn: () => getFn({ data: { id } }) });

  const [benefits, setBenefits] = useState("");
  const [notes, setNotes] = useState("");

  const mut = useMutation({
    mutationFn: (status: any) =>
      updFn({
        data: {
          id,
          status,
          estimated_benefits: benefits ? Number(benefits) : undefined,
          notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Updated.");
      qc.invalidateQueries({ queryKey: ["partner-citizen", id] });
      qc.invalidateQueries({ queryKey: ["partner-stats"] });
      qc.invalidateQueries({ queryKey: ["partner-citizens"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update."),
  });

  const delMut = useMutation({
    mutationFn: () => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Citizen removed.");
      qc.invalidateQueries({ queryKey: ["partner-stats"] });
      qc.invalidateQueries({ queryKey: ["partner-followups"] });
      qc.invalidateQueries({ queryKey: ["partner-citizens"] });
      nav({ to: "/partner/citizens" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete."),
  });

  if (q.isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }
  if (!q.data) return null;
  const c = q.data.citizen;
  const recs = q.data.recommendations;
  const currentIdx = STAGES.findIndex((s) => s.key === c.status);
  const summary = buildAiSummary(recs as any, q.data.family.length);

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/partner/citizens"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to citizens
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {c.full_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                c.age && `${c.age}y`,
                c.gender,
                c.occupation,
                c.district,
                c.state,
                c.mobile,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={c.status} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {c.full_name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the citizen and all follow-up records from your workspace.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => delMut.mutate()}
                    disabled={delMut.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {delMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Follow-up progress */}
        <div className="mt-6 rounded-3xl border border-border/70 bg-card p-6">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Follow-up progress
          </p>
          <ol className="mt-4 flex flex-wrap items-center gap-2">
            {STAGES.map((s, i) => {
              const done = i <= currentIdx;
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    disabled={mut.isPending}
                    onClick={() => mut.mutate(s.key)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      done
                        ? "bg-[var(--trust)] text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">{i + 1}</span>}
                    {s.label}
                  </button>
                  {i < STAGES.length - 1 && (
                    <span className="h-px w-4 bg-border" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Estimated benefit unlocked (₹)
              </Label>
              <Input
                type="number"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder={String(c.estimated_benefits ?? 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Follow-up note
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 min-h-[40px]"
                placeholder="Optional note added to the next update."
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tap a stage above to move this citizen forward. Numbers roll into your dashboard live.
          </p>
        </div>

        <div className="mt-8">
          <AiSummaryCard summary={summary} />
        </div>

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="rounded-3xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
                Preparing report…
              </div>
            }
          >
            <WelfareReport
              citizen={c as any}
              family={(q.data.family ?? []) as any}
              recommendations={recs as any}
            />
          </Suspense>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Recommended schemes
          </h2>
          {recs.length === 0 ? (
            <RecoveryState
              kind="missing-profile"
              title="Add more profile details"
              hint="Fill in age, income, occupation and location so we can match this citizen with the right schemes."
              primaryHref="/partner/citizens"
              primaryLabel="Edit intake"
              secondaryHref="/partner"
              secondaryLabel="Back to portal"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((r: any, i: number) => (
                <SchemeCard key={`${r.scheme.id}-${i}`} rec={r} />
              ))}
            </div>
          )}
        </div>

        {c.notes && (
          <div className="mt-8 rounded-3xl border border-border/70 bg-card p-6">
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Intake notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{c.notes}</p>
          </div>
        )}
      </section>
    </PageShell>
  );
}

// Silence unused import warning in future dev; keep Save available if this page grows an edit flow.
void Save;