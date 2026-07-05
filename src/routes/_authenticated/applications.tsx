import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, ExternalLink, Loader2 } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listApplications, upsertApplication } from "@/lib/citizen.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications — SAARTHI" }, { name: "description", content: "Track your welfare scheme applications." }] }),
  component: ApplicationsPage,
});

const STATUS_LABEL: Record<string, string> = {
  saved: "Saved",
  in_progress: "In progress",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<string, string> = {
  saved: "var(--muted-foreground)",
  in_progress: "var(--saffron)",
  submitted: "var(--trust)",
  approved: "var(--success)",
  rejected: "var(--destructive)",
};

function ApplicationsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listApplications);
  const upsert = useServerFn(upsertApplication);
  const q = useQuery({ queryKey: ["applications"], queryFn: () => list() });

  const setStatus = useMutation({
    mutationFn: (row: { scheme_id: string; status: any }) => upsert({ data: row }),
    onSuccess: () => {
      toast.success("Updated.");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const apps = q.data ?? [];
  const counts = apps.reduce<Record<string, number>>((a, r: any) => { a[r.status] = (a[r.status] ?? 0) + 1; return a; }, {});

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Applications</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your journey so far</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Every scheme you've unlocked, in one place. Update status as things move forward.
          </p>
        </header>

        {apps.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(["in_progress","submitted","approved","saved","rejected"] as const).map((s) => (
              <div key={s} className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{STATUS_LABEL[s]}</p>
                <p className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)", color: STATUS_COLOR[s] }}>{counts[s] ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          {q.isLoading ? (
            <Loader />
          ) : apps.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {apps.map((r: any) => (
                <li key={r.id} className="rounded-3xl border border-border/70 bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link to="/schemes/$id" params={{ id: r.schemes.id }} className="text-lg font-semibold hover:underline">
                        {r.schemes.name}
                      </Link>
                      <p className="text-xs capitalize text-muted-foreground">{r.schemes.category}</p>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.schemes.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={r.status}
                        onValueChange={(v) => setStatus.mutate({ scheme_id: r.schemes.id, status: v })}
                      >
                        <SelectTrigger className="h-9 w-40 rounded-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button asChild size="sm" variant="ghost" className="rounded-full">
                        <a href={r.schemes.official_url} target="_blank" rel="noreferrer">
                          Official <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)]"><ClipboardList className="h-5 w-5" /></span>
      <h2 className="mt-4 text-lg font-semibold">No applications yet</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Unlock an opportunity from your benefits feed to see it here.</p>
      <Button asChild className="mt-4 rounded-full"><Link to="/benefits">Browse benefits</Link></Button>
    </div>
  );
}

function Loader() { return <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>; }