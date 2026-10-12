import type { SVGProps } from "react";

export function StockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="17.5" rx="8.4" ry="3" fill="currentColor" opacity="0.55" />
      <ellipse cx="12" cy="12.2" rx="8.4" ry="3" fill="currentColor" opacity="0.78" />
      <ellipse cx="12" cy="7" rx="8.4" ry="3" fill="currentColor" />
    </svg>
  );
}
