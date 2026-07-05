import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { listDocuments, upsertDocument, deleteDocument } from "@/lib/citizen.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — SAARTHI" }, { name: "description", content: "Track and manage documents you need for welfare schemes." }] }),
  component: DocumentsPage,
});

const COMMON_DOCS = [
  "Aadhaar card",
  "PAN card",
  "Ration card (NFSA / BPL)",
  "Voter ID",
  "Bank passbook / account",
  "Income certificate",
  "Caste certificate (SC/ST/OBC)",
  "Disability certificate (UDID)",
  "Land record (Khata / Pahani)",
  "Birth certificate",
  "Death certificate (spouse)",
  "Domicile certificate",
];

function DocumentsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listDocuments);
  const upsert = useServerFn(upsertDocument);
  const del = useServerFn(deleteDocument);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const q = useQuery({ queryKey: ["documents"], queryFn: () => list() });

  const saveMut = useMutation({
    mutationFn: (row: any) => upsert({ data: row }),
    onSuccess: () => {
      toast.success("Saved.");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed.");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const docs = q.data ?? [];
  const verified = docs.filter((d: any) => d.status === "verified" || d.status === "have").length;

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Documents</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>Your documents</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Keep track of what you have and what's still missing. Faster applications, fewer surprises.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12 rounded-full px-6" onClick={() => setEditing({ status: "have" })}>
                <Plus className="mr-2 h-4 w-4" /> Add document
              </Button>
            </DialogTrigger>
            <DocDialog value={editing} onSubmit={(row) => saveMut.mutate(row)} pending={saveMut.isPending} />
          </Dialog>
        </header>

        {docs.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span>{verified} of {docs.length} on file</span>
              <span className="text-muted-foreground">{Math.round((verified / docs.length) * 100)}% ready</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${(verified / docs.length) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="mt-6">
          {q.isLoading ? (
            <Loader />
          ) : docs.length === 0 ? (
            <EmptyState onAdd={() => { setEditing({ status: "have" }); setOpen(true); }} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {docs.map((d: any) => (
                <li key={d.id} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${d.status === "missing" ? "bg-muted text-muted-foreground" : "bg-[color-mix(in_oklch,var(--success)_15%,transparent)] text-[var(--success)]"}`}>
                    {d.status === "missing" ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{d.label}</p>
                    <p className="text-xs capitalize text-muted-foreground">{d.doc_type} · {d.status}</p>
                    {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(d); setOpen(true); }}>Edit</Button>
                    <Button size="icon" variant="ghost" onClick={() => delMut.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
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

function DocDialog({ value, onSubmit, pending }: { value: any; onSubmit: (r: any) => void; pending: boolean }) {
  const [form, setForm] = useState<any>(value ?? { status: "have" });
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{form.id ? "Edit document" : "Add document"}</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Document</Label>
          <Select value={form.label ?? undefined} onValueChange={(v) => setForm({ ...form, label: v, doc_type: v })}>
            <SelectTrigger><SelectValue placeholder="Pick a document…" /></SelectTrigger>
            <SelectContent>{COMMON_DOCS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={form.status ?? "have"} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="have">Have it</SelectItem>
              <SelectItem value="verified">Verified & saved</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Notes (optional)</Label>
          <Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => {
          if (!form.label) return toast.error("Please pick a document.");
          onSubmit({ ...form });
        }} className="rounded-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--trust)]"><FileText className="h-5 w-5" /></span>
      <h2 className="mt-4 text-lg font-semibold">Track your documents</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Start with Aadhaar and your bank passbook — most schemes need them.</p>
      <Button className="mt-4 rounded-full" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Add first document</Button>
    </div>
  );
}

function Loader() { return <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>; }