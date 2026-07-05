import { useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PlusCircle, Search } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listPartnerCitizens } from "@/lib/partner.functions";
import { StatusBadge } from "@/components/partner-status-badge";

const searchSchema = z.object({
  status: z
    .enum([
      "need_documents",
      "application_submitted",
      "waiting_approval",
      "benefit_received",
      "completed",
    ])
    .optional(),
});

export const Route = createFileRoute("/_authenticated/partner/citizens")({
  head: () => ({
    meta: [
      { title: "Citizens — SAARTHI Partner" },
      { name: "description", content: "Search and manage the citizens you're assisting." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: CitizensPage,
});

const STATUSES = [
  { key: "all", label: "All" },
  { key: "need_documents", label: "Need documents" },
  { key: "application_submitted", label: "Submitted" },
  { key: "waiting_approval", label: "Waiting approval" },
  { key: "benefit_received", label: "Benefit received" },
  { key: "completed", label: "Completed" },
] as const;

function CitizensPage() {
  const search = useSearch({ from: "/_authenticated/partner/citizens" });
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState<string>(search.status ?? "all");

  const listFn = useServerFn(listPartnerCitizens);
  const q = useQuery({
    queryKey: ["partner-citizens", query, district, status],
    queryFn: () =>
      listFn({
        data: {
          query: query || undefined,
          district: district || undefined,
          status: (status === "all" ? undefined : status) as any,
        },
      }),
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
              Your citizens
            </p>
            <h1 className="mt-1 text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Search & follow-up
            </h1>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/partner/intake">
              <PlusCircle className="mr-2 h-4 w-4" />
              New intake
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-3xl border border-border/70 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or mobile…"
                className="pl-9"
              />
            </div>
            <Input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Filter by district"
            />
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    status === s.key
                      ? "bg-[var(--trust)] text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border/70 bg-card">
          {q.isLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (q.data ?? []).length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No citizens match your filters.</p>
              <Button asChild className="mt-4 rounded-full">
                <Link to="/partner/intake">Start a new intake</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(q.data ?? []).map((c: any) => (
                <li key={c.id}>
                  <Link
                    to="/partner/citizens/$id"
                    params={{ id: c.id }}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/40"
                  >
                    <div>
                      <p className="font-semibold">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">
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
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}