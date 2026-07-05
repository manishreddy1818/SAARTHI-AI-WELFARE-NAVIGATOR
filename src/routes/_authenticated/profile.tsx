import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getProfile, updateProfile } from "@/lib/citizen.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Your profile — SAARTHI" }, { name: "description", content: "Your editable citizen profile." }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const get = useServerFn(getProfile);
  const upd = useServerFn(updateProfile);
  const profQ = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (profQ.data) setForm(profQ.data);
  }, [profQ.data]);

  const mut = useMutation({
    mutationFn: (patch: any) => upd({ data: patch }),
    onSuccess: (res) => {
      toast.success(`Profile saved · ${res.completeness ?? 0}% complete`);
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });

  function save() {
    const patch: any = {};
    for (const k of [
      "full_name","age","gender","state","district","occupation","monthly_income",
      "marital_status","category","household_type","household_size","has_disability","preferred_language",
    ]) {
      const v = form[k];
      if (v === "" || v == null) continue;
      patch[k] = k === "age" || k === "household_size" ? Number(v) :
                 k === "monthly_income" ? Number(v) :
                 v;
    }
    mut.mutate(patch);
  }

  if (profQ.isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const completeness = form.profile_completeness ?? 0;

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Your profile</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
              Editable summary
            </h1>
            <p className="mt-2 text-muted-foreground">
              Everything SAARTHI knows about you. Fix anything, add missing details.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>{completeness}%</p>
            <p className="text-xs text-muted-foreground">complete</p>
          </div>
        </header>

        <div className="mt-8 grid gap-6 rounded-3xl border border-border/70 bg-card p-6 sm:p-8">
          <Row label="Full name">
            <Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Row>
          <div className="grid gap-6 sm:grid-cols-2">
            <Row label="Age">
              <Input type="number" min={0} max={120} value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </Row>
            <Row label="Gender">
              <Choice value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={["female","male","other"]} />
            </Row>
            <Row label="State">
              <Input value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Karnataka" />
            </Row>
            <Row label="District">
              <Input value={form.district ?? ""} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Mysuru" />
            </Row>
            <Row label="Occupation">
              <Input value={form.occupation ?? ""} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="farmer / street vendor / artisan / …" />
            </Row>
            <Row label="Monthly household income (₹)">
              <Input type="number" min={0} value={form.monthly_income ?? ""} onChange={(e) => setForm({ ...form, monthly_income: e.target.value })} />
            </Row>
            <Row label="Marital status">
              <Choice value={form.marital_status} onChange={(v) => setForm({ ...form, marital_status: v })} options={["single","married","widow","divorced"]} />
            </Row>
            <Row label="Social category">
              <Choice value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["general","obc","sc","st","minority"]} />
            </Row>
            <Row label="Household type">
              <Choice value={form.household_type} onChange={(v) => setForm({ ...form, household_type: v })} options={["rural","urban"]} />
            </Row>
            <Row label="Household size">
              <Input type="number" min={1} max={30} value={form.household_size ?? ""} onChange={(e) => setForm({ ...form, household_size: e.target.value })} />
            </Row>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Person with disability (80%+)</p>
              <p className="text-xs text-muted-foreground">Unlocks disability-focused schemes.</p>
            </div>
            <Switch checked={!!form.has_disability} onCheckedChange={(v) => setForm({ ...form, has_disability: v })} />
          </div>
          <div className="flex justify-end">
            <Button size="lg" className="h-12 rounded-full px-8" onClick={save} disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Choice({ value, onChange, options }: { value: string | undefined; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="h-10 capitalize"><SelectValue placeholder="Select" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}