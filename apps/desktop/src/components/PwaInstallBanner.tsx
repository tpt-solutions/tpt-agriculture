import { useEffect, useState } from "react";
import { Button } from "@tpt/ui";

const DISMISSED_KEY = "tpt-pwa-install-dismissed";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  async function handleInstall() {
    const p = deferredPrompt;
    if (!p) return;
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
    setDeferredPrompt(null);
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-green-200 bg-white p-4 shadow-lg">
      <p className="mb-2 text-sm font-medium text-gray-800">
        Install TPT Agriculture as an app
      </p>
      <p className="mb-3 text-xs text-gray-500">
        Works offline and feels like a native app.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleInstall}>Install</Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>Dismiss</Button>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
