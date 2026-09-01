"use server";

import { redirect } from "next/navigation";
import { getStaffSession, clearStaffSession } from "@/lib/session";
import { logAudit } from "@/lib/auth";

export async function staffLogoutAction() {
  const session = await getStaffSession();
  if (session) {
    await logAudit({ userId: session.sub, action: "staff.logout", entityType: "User", entityId: session.sub });
  }
  await clearStaffSession();
  redirect("/staff-login");
}
