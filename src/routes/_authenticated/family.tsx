import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { listFamily, upsertFamily, deleteFamily, getRecommendations } from "@/lib/citizen.functions";
import { buildHouseholdSummary, HouseholdSummaryCard } from "@/components/household-summary";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/family")({
  head: () => ({ meta: [{ title: "Family — SAARTHI" }, { name: "description", content: "Manage your family members." }] }),
  component: FamilyPage,
});

function FamilyPage() {
  const qc = useQueryClient();
  const list = useServerFn(listFamily);
  const upsert = useServerFn(upsertFamily);
  const del = useServerFn(deleteFamily);
  const recFn = useServerFn(getRecommendations);
  const { user } = useAuth();
  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "You";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const q = useQuery({ queryKey: ["family"], queryFn: () => list(), staleTime: 60_000 });
  const recQ = useQuery({ queryKey: ["recommendations"], queryFn: () => recFn(), staleTime: 60_000 });
  const household =
    recQ.data && q.data
      ? buildHouseholdSummary(recQ.data.recommendations as any, q.data as any, firstName)
      : null;

  const saveMut = useMutation({
    mutationFn: (row: any) => upsert({ data: row }),
    onSuccess: () => {
      toast.success("Saved.");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["family"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed.");
      qc.invalidateQueries({ queryKey: ["family"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Family</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your household</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Add family members so SAARTHI can find schemes for each of them too.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 rounded-full px-6" onClick={() => setEditing({})}>
                <Plus className="mr-2 h-4 w-4" /> Add member
              </Button>
            </DialogTrigger>
            <MemberDialog value={editing} onSubmit={(row) => saveMut.mutate(row)} pending={saveMut.isPending} />
          </Dialog>
        </header>

        <div className="mt-8">
          {q.isLoading ? (
            <Loader />
          ) : (q.data ?? []).length === 0 ? (
            <EmptyState onAdd={() => { setEditing({}); setOpen(true); }} />
          ) : (
            <>
            {household && household.totalEligible > 0 && (
              <div className="mb-6"><HouseholdSummaryCard summary={household} /></div>
            )}
            <ul className="grid gap-4 sm:grid-cols-2">
              {q.data!.map((m: any) => (
                <li key={m.id} className="rounded-3xl border border-border/70 bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{m.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {m.relationship}
                        {m.age != null && ` · ${m.age} yrs`}
                        {m.gender && ` · ${m.gender}`}
                      </p>
                      {m.occupation && <p className="mt-1 text-sm">{m.occupation}</p>}
                      {m.has_disability && (
                        <span className="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                          {m.disability_type === "other" && m.other_disability_type
                            ? `${m.other_disability_type}${m.disability_percentage != null ? ` · ${m.disability_percentage}%` : ""}`
                            : `Person with disability${m.disability_type ? ` · ${m.disability_type}` : ""}${m.disability_percentage != null ? ` · ${m.disability_percentage}%` : ""}`}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(m); setOpen(true); }}>Edit</Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${m.name}`}
                        className="min-h-11 min-w-11"
                        onClick={() => delMut.mutate(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function MemberDialog({ value, onSubmit, pending }: { value: any; onSubmit: (r: any) => void; pending: boolean }) {
  const [form, setForm] = useState<any>(value ?? {});
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>{form.id ? "Edit family member" : "Add family member"}</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Relationship</Label>
            <Input placeholder="mother / son / spouse" value={form.relationship ?? ""} onChange={(e) => setForm({ ...form, relationship: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Age</Label>
            <Input type="number" min={0} max={120} value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Gender</Label>
            <Select value={form.gender ?? undefined} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger className="capitalize"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["female","male","other"].map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Occupation</Label>
            <Input value={form.occupation ?? ""} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          </div>
        </div>
        <div className="rounded-xl bg-secondary/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Person with disability</p>
              <p className="text-xs text-muted-foreground">Helps match disability schemes.</p>
            </div>
            <Switch
              checked={!!form.has_disability}
              onCheckedChange={(v) =>
                setForm({ ...form, has_disability: v, ...(v ? {} : { disability_type: "", disability_percentage: "", other_disability_type: "" }) })
              }
            />
          </div>
          {form.has_disability && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Type of disability</Label>
                <Select
                  value={form.disability_type ?? undefined}
                  onValueChange={(v) => setForm({ ...form, disability_type: v, other_disability_type: v === "other" ? form.other_disability_type : "" })}
                >
                  <SelectTrigger className="capitalize"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["locomotor","visual","hearing","speech","intellectual","mental illness","multiple","other"].map((o) => (
                      <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Percentage (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 60"
                  value={form.disability_percentage ?? ""}
                  onChange={(e) => setForm({ ...form, disability_percentage: e.target.value })}
                />
              </div>
              {form.disability_type === "other" && (
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label className="text-xs">Please specify the disability</Label>
                  <Input
                    placeholder="e.g. cerebral palsy, autism spectrum, chronic neurological condition"
                    value={form.other_disability_type ?? ""}
                    onChange={(e) => setForm({ ...form, other_disability_type: e.target.value })}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">This helps SAARTHI match schemes for the specific condition.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => {
            if (!form.name || !form.relationship) return toast.error("Name and relationship are required.");
            const patch: any = { ...form };
            if (patch.age !== undefined && patch.age !== "") patch.age = Number(patch.age);
            else delete patch.age;
            if (patch.disability_percentage !== undefined && patch.disability_percentage !== "")
              patch.disability_percentage = Number(patch.disability_percentage);
            else delete patch.disability_percentage;
            if (!patch.has_disability) {
              delete patch.disability_type;
              delete patch.disability_percentage;
              delete patch.other_disability_type;
            }
            if (patch.disability_type !== "other") {
              delete patch.other_disability_type;
            }
            onSubmit(patch);
          }}
          disabled={pending}
          className="rounded-full"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)]">
        <Users className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Add your family</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Even a parent, spouse, or child added here can unlock benefits for the whole family.
      </p>
      <Button className="mt-4 rounded-full" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Add first member</Button>
    </div>
  );
}

function Loader() { return <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>; }