import { AlertTriangle, ArrowLeft, RefreshCw, WifiOff, Mic, Sparkles, Inbox, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export type RecoveryKind =
  | "empty"
  | "network"
  | "timeout"
  | "voice"
  | "ai"
  | "upload"
  | "server"
  | "permission"
  | "missing-profile";

type Meta = { icon: React.ComponentType<{ className?: string }>; title: string; hint: string };

const META: Record<RecoveryKind, Meta> = {
  empty: {
    icon: Inbox,
    title: "Nothing here yet",
    hint: "Add a few details to your profile and we'll surface what fits.",
  },
  network: {
    icon: WifiOff,
    title: "You seem offline",
    hint: "Check your internet connection and try again.",
  },
  timeout: {
    icon: RefreshCw,
    title: "That took longer than expected",
    hint: "The server didn't respond in time. Please retry.",
  },
  voice: {
    icon: Mic,
    title: "Voice is unavailable",
    hint: "Your microphone couldn't be used. You can type your answer instead.",
  },
  ai: {
    icon: Sparkles,
    title: "AI response unavailable",
    hint: "We couldn't reach the assistant. Deterministic results are shown below.",
  },
  upload: {
    icon: AlertTriangle,
    title: "Upload failed",
    hint: "The file couldn't be uploaded. Check the size (max 10 MB) and try again.",
  },
  server: {
    icon: ShieldAlert,
    title: "Something went wrong",
    hint: "Our servers are having a moment. Please try again shortly.",
  },
  permission: {
    icon: ShieldAlert,
    title: "Permission needed",
    hint: "Grant the requested permission and retry.",
  },
  "missing-profile": {
    icon: AlertTriangle,
    title: "A few details are missing",
    hint: "Complete your profile so we can find the right benefits for you.",
  },
};

export function RecoveryState({
  kind,
  title,
  hint,
  onRetry,
  retryLabel = "Try again",
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel = "Back",
  className = "",
}: {
  kind: RecoveryKind;
  title?: string;
  hint?: string;
  onRetry?: () => void;
  retryLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  const meta = META[kind];
  const Icon = meta.icon;
  return (
    <div
      className={`rounded-3xl border border-dashed border-border/70 bg-card/50 p-8 text-center ${className}`}
      role="status"
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {title ?? meta.title}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{hint ?? meta.hint}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button onClick={onRetry} className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        )}
        {primaryHref && primaryLabel && (
          <Button asChild className="rounded-full">
            <Link to={primaryHref as any}>{primaryLabel}</Link>
          </Button>
        )}
        {secondaryHref && (
          <Button asChild variant="outline" className="rounded-full">
            <Link to={secondaryHref as any}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {secondaryLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}