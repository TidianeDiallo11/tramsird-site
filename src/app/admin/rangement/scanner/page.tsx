import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = { title: "Scanner un produit" };

export default async function ScannerPage() {
  await requirePermission("stock.view");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Scanner un code-barres</h1>
        <p className="text-sm text-muted-foreground">Retrouvez instantanément un produit et son emplacement</p>
      </div>
      <ScannerClient />
    </div>
  );
}
