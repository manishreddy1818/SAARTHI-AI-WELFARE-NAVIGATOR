import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export function AppHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const showAuthCta = !loading && !user;
  const links: Array<{ to: string; label: string }> = [
    { to: "/stories", label: "Stories" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandLogo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`hidden sm:inline-flex rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.to
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/citizen"
                className="hidden sm:inline-flex rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary/70"
              >
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : showAuthCta ? (
            <Button asChild size="sm" className="rounded-full px-5">
              <Link to="/role-select">Get started</Link>
            </Button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} SAARTHI — Public good, built with care.</p>
        <p>Voice-first · Multilingual · Accessible</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}