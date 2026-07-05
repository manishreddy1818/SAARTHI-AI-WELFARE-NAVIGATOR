import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageShell } from "@/components/app-shell";
import { BrandMark } from "@/components/brand";
import { toast } from "sonner";

const searchSchema = z.object({
  role: z.enum(["citizen", "partner"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — SAARTHI" },
      {
        name: "description",
        content: "Sign in or create your SAARTHI account to start your welfare journey.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role, redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const defaultRedirect = role === "partner" ? "/partner" : "/citizen";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: safePath(redirect) ?? defaultRedirect, replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate, redirect, defaultRedirect]);

  async function handleGoogle() {
    if (loading) return;
    setAuthMessage(null);
    setNeedsConfirmation(false);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not sign in with Google.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: safePath(redirect) ?? defaultRedirect, replace: true });
    } catch (e) {
      toast.error("Something went wrong signing in.");
      setLoading(false);
    }
  }

  async function handleEmail(mode: "signin" | "signup", email: string, password: string, name: string) {
    if (loading) return;
    setAuthMessage(null);
    setNeedsConfirmation(false);
    setLastEmail(email);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name, journey: role ?? "citizen" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const message = "Account created. Please open the confirmation email we sent, then come back and sign in.";
          setNeedsConfirmation(true);
          setAuthMessage(message);
          toast.success(message);
          return;
        }
        toast.success("Account created. Welcome to SAARTHI.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: safePath(redirect) ?? defaultRedirect, replace: true });
    } catch (e: any) {
      const message = friendlyAuthMessage(e, mode);
      if (isEmailNotConfirmed(e)) setNeedsConfirmation(true);
      setAuthMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!lastEmail || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: lastEmail,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const message = `Confirmation email sent again to ${lastEmail}. Please check inbox and spam.`;
      setAuthMessage(message);
      toast.success(message);
    } catch (e: any) {
      const message = e?.message?.toLowerCase?.().includes("rate")
        ? "Please wait a minute before requesting another confirmation email."
        : "Could not resend confirmation email. Please try again shortly.";
      setAuthMessage(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  }

  if (checking) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={52} />
          <h1
            className="text-3xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {role === "partner" ? "Welcome, welfare partner" : "Welcome to SAARTHI"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "partner"
              ? "Sign in to help citizens claim the benefits they deserve."
              : "Sign in to start your voice-first welfare journey."}
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-full text-base"
            disabled={loading}
            onClick={handleGoogle}
          >
            <GoogleIcon className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          {authMessage && (
            <Alert className="mb-5 border-[var(--trust)]/30 bg-[var(--trust)]/5">
              <AlertDescription className="space-y-3">
                <p>{authMessage}</p>
                {needsConfirmation && lastEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={resending}
                    onClick={handleResendConfirmation}
                  >
                    {resending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Resend confirmation email
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <EmailForm mode="signin" loading={loading} onSubmit={handleEmail} />
            </TabsContent>
            <TabsContent value="signup">
              <EmailForm mode="signup" loading={loading} onSubmit={handleEmail} />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree that SAARTHI may store the answers you share to help
          match you with welfare benefits. You can delete your data anytime.
        </p>
        <p className="text-center text-sm">
          <Link to="/role-select" className="text-[var(--trust)] hover:underline">
            Change journey
          </Link>
        </p>
      </section>
    </PageShell>
  );
}

function EmailForm({
  mode,
  loading,
  onSubmit,
}: {
  mode: "signin" | "signup";
  loading: boolean;
  onSubmit: (mode: "signin" | "signup", email: string, password: string, name: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(mode, email.trim(), password, name.trim());
      }}
    >
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Sharma"
            required
            className="h-12"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="h-12"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          minLength={8}
          required
          className="h-12"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-full text-base"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

function safePath(p: string | undefined) {
  if (!p) return undefined;
  if (!p.startsWith("/") || p.startsWith("//")) return undefined;
  return p;
}

function friendlyAuthMessage(error: any, mode: "signin" | "signup") {
  const code = String(error?.code ?? "").toLowerCase();
  const raw = String(error?.message ?? "").toLowerCase();

  if (code.includes("invalid_credentials") || raw.includes("invalid login credentials")) {
    return "Wrong email or password. If you do not have an account yet, choose Create account.";
  }
  if (code.includes("weak_password") || raw.includes("weak password") || raw.includes("pwned")) {
    return "This password is too common and not allowed. Please choose a stronger, unique password.";
  }
  if (code.includes("user_already") || code.includes("email_exists") || raw.includes("already registered") || raw.includes("already exists")) {
    return "An account already exists with this email. Please use Sign in instead.";
  }
  if (isEmailNotConfirmed(error)) {
    return "Your account exists, but email login is locked until you click the confirmation link in your email.";
  }

  return mode === "signup"
    ? "Could not create the account. Please check the details and try again."
    : "Could not sign in. Please check your email and password.";
}

function isEmailNotConfirmed(error: any) {
  const code = String(error?.code ?? "").toLowerCase();
  const raw = String(error?.message ?? "").toLowerCase();
  return code.includes("email_not_confirmed") || raw.includes("email not confirmed");
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.28-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.85 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.67-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}