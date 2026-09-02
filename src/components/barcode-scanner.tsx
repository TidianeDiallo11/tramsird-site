"use client";

import * as React from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<IScannerControls | null>(null);
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastCodeRef = React.useRef<{ code: string; at: number } | null>(null);

  async function start() {
    setError(null);
    try {
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (!result) return;
        const code = result.getText();
        const now = Date.now();
        if (lastCodeRef.current?.code === code && now - lastCodeRef.current.at < 2000) return;
        lastCodeRef.current = { code, at: now };
        onDetected(code);
      });
      controlsRef.current = controls;
      setActive(true);
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
    }
  }

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }

  React.useEffect(() => () => controlsRef.current?.stop(), []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
            Caméra inactive
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={active ? stop : start} variant={active ? "outline" : "default"} className="w-full gap-2">
        {active ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
        {active ? "Arrêter le scan" : "Activer la caméra"}
      </Button>
    </div>
  );
}
