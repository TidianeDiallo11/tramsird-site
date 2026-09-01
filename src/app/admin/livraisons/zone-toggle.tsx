"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { toggleZoneActiveAction } from "./actions";

export function ZoneToggle({ zoneId, active }: { zoneId: string; active: boolean }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Switch
      checked={active}
      disabled={pending}
      onCheckedChange={() => startTransition(() => toggleZoneActiveAction(zoneId))}
    />
  );
}
