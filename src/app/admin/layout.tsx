import { requireStaff } from "@/lib/auth";
import { permissionsFor } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const allowed = new Set(permissionsFor(session.role));

  return (
    <div className="min-h-svh bg-surface-muted">
      <AdminSidebar allowed={allowed} />
      <div className="lg:pl-64">
        <AdminTopbar name={session.name} role={session.role} userId={session.sub} allowed={allowed} />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
