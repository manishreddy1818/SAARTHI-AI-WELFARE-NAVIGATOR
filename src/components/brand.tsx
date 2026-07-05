import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-2xl bg-[var(--trust)] text-[var(--primary-foreground)] shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Compass strokeWidth={2.25} style={{ width: size * 0.55, height: size * 0.55 }} />
    </span>
  );
}

export function BrandLogo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span
          className="text-2xl font-semibold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          SAARTHI
        </span>
        {tagline && (
          <span className="text-xs text-muted-foreground">
            Your guide to welfare benefits
          </span>
        )}
      </span>
    </Link>
  );
}