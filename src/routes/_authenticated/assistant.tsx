import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { Loader2, RotateCcw, Send, Sparkles, Square, Trash2, Volume2, VolumeX } from "lucide-react";
import { PageShell } from "@/components/app-shell";
import { AnalyzingSteps, CHAT_THINKING_STEPS } from "@/components/analyzing-steps";
import { VoiceOrb } from "@/components/voice-orb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage, listConversations, getConversation, getProfile, deleteConversation } from "@/lib/citizen.functions";
import { toast } from "sonner";
import { useSpeech } from "@/hooks/use-speech";
import { VOICE_OPTIONS, ACCENT_OPTIONS } from "@/hooks/use-speech";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeEventsGrid } from "@/components/life-events";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "Talk to SAARTHI — Assistant" },
      { name: "description", content: "Voice-first conversation with your SAARTHI welfare assistant." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { id?: string; role: "user" | "assistant"; content: string };

const STARTERS = [
  "I am a 65 year old widow, what can help me?",
  "I am a small farmer in Karnataka.",
  "My daughter is 8 years old — what schemes fit her?",
  "I sell vegetables on the street. Any support for me?",
];

function AssistantPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [suggested, setSuggested] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { speak, stop, replay, muted, setMuted, speaking, loadingId, voice, setVoice, accent, setAccent } = useSpeech();

  const listConv = useServerFn(listConversations);
  const getConv = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const getProf = useServerFn(getProfile);
  const delConv = useServerFn(deleteConversation);

  const deleteMut = useMutation({
    mutationFn: (id: string) => delConv({ data: { id } }),
    onSuccess: (_res, id) => {
      toast.success("Conversation deleted");
      if (activeId === id) {
        setActiveId(null);
        setIsNew(true);
        setMessages([]);
        setSuggested([]);
      }
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Could not delete"),
  });

  const convsQ = useQuery({ queryKey: ["conversations"], queryFn: () => listConv() });
  const profQ = useQuery({ queryKey: ["profile"], queryFn: () => getProf() });

  useEffect(() => {
    if (!activeId && !isNew && convsQ.data && convsQ.data.length > 0) {
      setActiveId(convsQ.data[0].id);
    }
  }, [convsQ.data, activeId, isNew]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    getConv({ data: { id: activeId } }).then((rows) => {
      setMessages(rows.map((r) => ({ id: r.id, role: r.role as "user" | "assistant", content: r.content })));
    });
  }, [activeId, getConv]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    if (profQ.isLoading) return;
    greetedRef.current = true;
    const name = (profQ.data?.full_name || "").split(" ")[0];
    const greeting = name
      ? `Namaste ${name}. I'm SAARTHI. Tell me a little about you or your family, and I'll find the welfare schemes you may qualify for.`
      : `Namaste. I'm SAARTHI, your welfare navigator. Tell me a little about you or your family, and I'll find the schemes you may qualify for.`;
    speak(`greeting-${Date.now()}`, greeting);
  }, [profQ.isLoading, profQ.data, speak]);

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      return send({ data: { conversation_id: activeId, text } });
    },
    onMutate: async (text) => {
      setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "…thinking" }]);
      setSuggested([]);
      setInput("");
      stop();
    },
    onSuccess: (res) => {
      setActiveId(res.conversation_id);
      setIsNew(false);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: res.reply };
        return next;
      });
      setSuggested(res.suggested_prompts ?? []);
      const id = `${res.conversation_id}-${Date.now()}`;
      speak(id, res.reply);
      if (res.profile_updates && Object.keys(res.profile_updates).length > 0) {
        toast.success("I updated your profile with what you shared.");
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["recommendations"] });
      }
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Assistant is offline for a moment.");
      setMessages((m) => m.slice(0, -1));
    },
  });

  const busy = mutation.isPending;

  function handleSubmit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    mutation.mutate(t);
  }

  const showStarters = messages.length === 0;
  const completeness = profQ.data?.profile_completeness ?? 0;

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px,1fr]">
        <aside className="rounded-3xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Conversations</h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => {
                setActiveId(null);
                setIsNew(true);
                setMessages([]);
                setSuggested([]);
              }}
            >
              + New
            </Button>
          </div>
          <ul className="mt-3 space-y-1">
            {(convsQ.data ?? []).map((c) => (
              <li key={c.id}>
                <div
                  className={`group flex items-center gap-1 rounded-xl pr-1 transition-colors ${
                    activeId === c.id ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/60 text-muted-foreground"
                  }`}
                >
                  <button
                    onClick={() => { setActiveId(c.id); setIsNew(false); }}
                    className="flex-1 truncate rounded-xl px-3 py-2 text-left text-sm"
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this conversation? This cannot be undone.")) {
                        deleteMut.mutate(c.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete conversation"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
            {(convsQ.data ?? []).length === 0 && (
              <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                No conversations yet. Say hello below.
              </p>
            )}
          </ul>
          <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
            <p className="mt-2 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {completeness}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--trust)] transition-all" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Every fact you share improves your recommendations.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[70vh] flex-col rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">SAARTHI</p>
            <div className="flex items-center gap-1">
              <Select value={accent} onValueChange={(v) => setAccent(v as any)}>
                <SelectTrigger className="h-8 w-[130px] rounded-full text-xs">
                  <SelectValue placeholder="Accent" />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_OPTIONS.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="h-8 w-[140px] rounded-full text-xs">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {speaking && (
                <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={stop}>
                  <Square className="mr-1 h-3 w-3" fill="currentColor" />
                  Stop speaking
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={replay}
                disabled={!!loadingId}
                title="Replay last reply"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Replay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => setMuted(!muted)}
                title={muted ? "Unmute voice" : "Mute voice"}
              >
                {muted ? <VolumeX className="mr-1 h-3 w-3" /> : <Volume2 className="mr-1 h-3 w-3" />}
                {muted ? "Muted" : "Voice on"}
              </Button>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
            {showStarters ? (
              <EmptyState onPick={handleSubmit} />
            ) : (
              messages.map((m, i) => <Bubble key={m.id ?? i} m={m} busy={busy && i === messages.length - 1} />)
            )}
          </div>

          {suggested.length > 0 && !busy && (
            <div className="border-t border-border/60 px-6 py-3">
              <div className="flex flex-wrap gap-2">
                {suggested.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubmit(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            className="flex items-end gap-3 border-t border-border/60 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
          >
            <VoiceOrb size={52} disabled={busy} onTranscript={(t) => handleSubmit(t)} />
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or tap the mic to speak…"
              className="min-h-[48px] flex-1 resize-none rounded-2xl border-border/70 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(input);
                }
              }}
              disabled={busy}
            />
            <Button
              type="submit"
              disabled={busy || !input.trim()}
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function EmptyState({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex h-full flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-4 text-center">
      <span
        className="inline-flex h-16 w-16 items-center justify-center rounded-3xl text-primary-foreground shadow-lg"
        style={{ backgroundColor: "var(--trust)" }}
      >
        <Sparkles className="h-7 w-7" />
      </span>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Talk to SAARTHI
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Share a little about you or your family — by voice or text — and I'll find the welfare
          schemes you may qualify for. In any language you're comfortable in.
        </p>
      </div>
      </div>
      <LifeEventsGrid onPick={onPick} />
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-left text-sm text-foreground transition hover:border-[var(--trust)] hover:bg-secondary/50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ m, busy }: { m: Msg; busy: boolean }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-[var(--trust)] text-primary-foreground"
            : "bg-transparent text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{m.content}</p>
        ) : busy && m.content.startsWith("…") ? (
          <ThinkingTrace />
        ) : (
          <div className="prose prose-sm max-w-none [&>*]:my-2 [&_p]:my-2 [&_ul]:my-2">
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingTrace() {
  return (
    <div className="space-y-2 rounded-2xl bg-secondary/40 px-3 py-2.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        <span className="ml-1">SAARTHI is thinking</span>
      </span>
      <AnalyzingSteps active compact steps={CHAT_THINKING_STEPS} intervalMs={700} />
    </div>
  );
}