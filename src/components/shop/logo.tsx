import { cn } from "@/lib/utils";

export function Logo({
  className,
  name = "ShopFlow",
  logoUrl,
}: {
  className?: string;
  name?: string;
  logoUrl?: string | null;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={cn("h-8 w-auto object-contain", className)} />
    );
  }

  const [first, ...rest] = name.split(" ");
  const restLabel = rest.join(" ");

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
        {first}
        {restLabel && <span className="text-brand"> {restLabel}</span>}
      </span>
    </span>
  );
}
