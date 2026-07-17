import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Shows a subtle "Demo Data" chip in the header when the signed-in user's
 * profile has `is_demo = true`. Reads from `public.profiles` via RLS.
 */
export function DemoBadge() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["profile-is-demo", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_demo")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) return { is_demo: false };
      return { is_demo: Boolean((data as any)?.is_demo) };
    },
  });
  if (!q.data?.is_demo) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[var(--saffron)]/40 bg-[color:oklch(0.96_0.08_75)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--saffron)]"
      title="You're viewing demo data"
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      Demo
    </span>
  );
}