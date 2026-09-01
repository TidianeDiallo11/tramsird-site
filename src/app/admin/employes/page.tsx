import type { Metadata } from "next";
import { UserCog, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { hasPermission, ROLE_LABELS } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { EmployeeFormDialog } from "./employee-form-dialog";
import { EmployeeRoleSelect } from "./employee-role-select";
import { EmployeeActiveToggle } from "./active-toggle";

export const metadata: Metadata = { title: "Employés" };

export default async function EmployeesPage() {
  const session = await requirePermission("employees.view");
  const canManage = hasPermission(session.role, "employees.manage");

  const [employees, auditLogs] = await Promise.all([
    prisma.user.findMany({ include: { employee: true }, orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { user: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Employés</h1>
          <p className="text-sm text-muted-foreground">{employees.length} membre(s) de l&apos;équipe</p>
        </div>
        {canManage && <EmployeeFormDialog />}
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Actif</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              const initials = emp.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
              return (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.employee?.position ?? "—"}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <EmployeeRoleSelect userId={emp.id} role={emp.role} disabled={emp.id === session.sub} />
                    ) : (
                      <Badge variant="neutral">{ROLE_LABELS[emp.role]}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <EmployeeActiveToggle userId={emp.id} active={emp.active} />
                    ) : (
                      <Badge variant={emp.active ? "success" : "neutral"}>{emp.active ? "Actif" : "Inactif"}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 flex items-center gap-1.5 px-1 font-semibold"><History className="size-4" /> Journal des actions</h2>
        {auditLogs.length === 0 ? (
          <EmptyState icon={UserCog} title="Aucune action enregistrée" />
        ) : (
          <div className="space-y-2 text-sm">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
                <span>
                  <strong>{log.user?.name ?? "Système"}</strong> — {log.action.replace(/_/g, " ").replace(".", " › ")}
                  {log.entityId && <span className="text-muted-foreground"> ({log.entityType})</span>}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
