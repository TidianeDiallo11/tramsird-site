import { requirePermission } from "@/lib/auth";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("pos.sell");
  return <div className="min-h-svh bg-surface-muted">{children}</div>;
}
