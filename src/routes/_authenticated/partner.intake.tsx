import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ArrowRight, Loader2, Mic, Save, Sparkles } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { VoiceOrb } from "@/components/voice-orb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractIntake, upsertPartnerCitizen } from "@/lib/partner.functions";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["voice", "form"]).optional() });

export const Route = createFileRoute("/_authenticated/partner/intake")({
  head: () => ({
    meta: [
      { title: "New citizen intake — SAARTHI Partner" },
      { name: "description", content: "Interview a citizen by voice or form to unlock welfare schemes." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: IntakePage,
});

type Form = {
  full_name: string;
  mobile: string;
  age: string;
  gender: string;
  state: string;
  district: string;
  occupation: string;
  monthly_income: string;
  category: string;
  marital_status: string;
  has_disability: boolean;
  household_type: string;
  household_size: string;
  notes: string;
};

const EMPTY: Form = {
  full_name: "",
  mobile: "",
  age: "",
  gender: "",
  state: "",
  district: "",
  occupation: "",
  monthly_income: "",
  category: "",
  marital_status: "",
  has_disability: false,
  household_type: "",
  household_size: "",
  notes: "",
};

function IntakePage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const search = useSearch({ from: "/_authenticated/partner/intake" });
  const [mode, setMode] = useState<"voice" | "form">(search.mode ?? "voice");
  const [narrative, setNarrative] = useState("");
  const [form, setForm] = useState<Form>(EMPTY);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<string | null>(null);

  const extractFn = useServerFn(extractIntake);
  const saveFn = useServerFn(upsertPartnerCitizen);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: any = { full_name: form.full_name.trim() };
      if (!payload.full_name) throw new Error("Please enter the citizen's name.");
      const numFields = ["age", "monthly_income", "household_size"] as const;
      for (const [k, v] of Object.entries(form)) {
        if (k === "full_name") continue;
        if (v === "" || v === false) continue;
        payload[k] =
          numFields.includes(k as any) ? Number(v) : v;
      }
      const res = await saveFn({ data: payload });
      return res.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["partner-stats"] });
      qc.invalidateQueries({ queryKey: ["partner-followups"] });
      qc.invalidateQueries({ queryKey: ["partner-citizens"] });
      toast.success("Citizen saved. Loading recommendations…");
      nav({ to: "/partner/citizens/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });

  async function runExtract(text: string) {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const res = await extractFn({ data: { text } });
      if (res.ok && res.extracted) {
        const ex = res.extracted as any;
        setForm((f) => ({
          ...f,
          full_name: ex.full_name ?? f.full_name,
          age: ex.age != null ? String(ex.age) : f.age,
          gender: ex.gender ?? f.gender,
          state: ex.state ?? f.state,
          district: ex.district ?? f.district,
          occupation: ex.occupation ?? f.occupation,
          monthly_income: ex.monthly_income != null ? String(ex.monthly_income) : f.monthly_income,
          category: ex.category ?? f.category,
          marital_status: ex.marital_status ?? f.marital_status,
          has_disability: ex.has_disability ?? f.has_disability,
          household_type: ex.household_type ?? f.household_type,
          household_size: ex.household_size != null ? String(ex.household_size) : f.household_size,
          notes: ex.notes ?? (text.length > 20 ? text : f.notes),
        }));
        setExtractedSummary(ex.summary ?? null);
        setMode("form");
        toast.success("Extracted! Review the form below and save.");
      } else {
        toast.error("Extraction unavailable — please fill the form.");
        setMode("form");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--saffron)]">
            New intake
          </p>
          <h1
            className="mt-1 text-3xl font-semibold sm:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
          >
            Add a citizen to your workspace
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Interview by voice or fill in the form. SAARTHI will find welfare schemes the moment
            you save.
          </p>
        </div>

        <div className="mb-6 inline-flex rounded-full border border-border/70 bg-card p-1">
          <button
            onClick={() => setMode("voice")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              mode === "voice" ? "bg-[var(--trust)] text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Voice intake
          </button>
          <button
            onClick={() => setMode("form")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              mode === "form" ? "bg-[var(--trust)] text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Form intake
          </button>
        </div>

        {mode === "voice" && (
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <VoiceOrb
                size={96}
                disabled={analyzing}
                onTranscript={(t) => {
                  setNarrative((prev) => (prev ? `${prev} ${t}` : t));
                  runExtract(t);
                }}
              />
              <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                Tap and interview the citizen
              </p>
              <p className="max-w-lg text-sm text-muted-foreground">
                Ask about age, work, income, family, state — SAARTHI will listen and turn it into a
                structured profile you can review before saving.
              </p>
            </div>
            <div className="mt-6">
              <Label>Or type the intake narrative</Label>
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="e.g. Lakshmi Devi is a 68-year-old widow from a village in Karnataka. She lives alone. No pension yet."
                className="mt-2 min-h-[120px]"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => runExtract(narrative)}
                  disabled={analyzing || narrative.trim().length < 3}
                  className="rounded-full"
                >
                  {analyzing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Extract profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {mode === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMut.mutate();
            }}
            className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
          >
            {extractedSummary && (
              <div className="mb-5 rounded-2xl border border-[var(--saffron)]/30 bg-[color:oklch(0.98_0.03_75)] p-3 text-sm">
                <span className="font-medium">AI summary:</span> {extractedSummary}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name*">
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Mobile">
                <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </Field>
              <Field label="Age">
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={["female", "male", "other"]} />
              </Field>
              <Field label="State">
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </Field>
              <Field label="District">
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </Field>
              <Field label="Occupation">
                <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
              </Field>
              <Field label="Monthly income (₹)">
                <Input
                  type="number"
                  value={form.monthly_income}
                  onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
                />
              </Field>
              <Field label="Social category">
                <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["general", "obc", "sc", "st", "minority"]} />
              </Field>
              <Field label="Marital status">
                <Select value={form.marital_status} onChange={(v) => setForm({ ...form, marital_status: v })} options={["single", "married", "widow", "divorced"]} />
              </Field>
              <Field label="Household">
                <Select value={form.household_type} onChange={(v) => setForm({ ...form, household_type: v })} options={["rural", "urban"]} />
              </Field>
              <Field label="Household size">
                <Input
                  type="number"
                  value={form.household_size}
                  onChange={(e) => setForm({ ...form, household_size: e.target.value })}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.has_disability}
                  onChange={(e) => setForm({ ...form, has_disability: e.target.checked })}
                />
                Person with disability (80%+)
              </label>
              <Field label="Notes" full>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="min-h-[80px]"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("voice")}
                className="rounded-full"
              >
                <Mic className="mr-2 h-4 w-4" />
                Use voice
              </Button>
              <Button type="submit" disabled={saveMut.isPending} className="rounded-full">
                {saveMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save & find schemes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}
      </section>
    </PageShell>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}