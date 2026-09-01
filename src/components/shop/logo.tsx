import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-strong text-brand-foreground shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
          <path
            d="M4 12 L10 18 L20 6"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg leading-none">
        Shop<span className="text-brand">Flow</span>
      </span>
    </span>
  );
}
