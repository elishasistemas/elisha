"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "pwa-install-dismissed-v1";

function useIsStandalone() {
  const [standalone, setStandalone] = React.useState(false);
  React.useEffect(() => {
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && (navigator as any).standalone === true);
    setStandalone(isStandalone);
  }, []);
  return standalone;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

export default function PWAInstall() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = React.useState(false);
  const [showBar, setShowBar] = React.useState(false);
  const standalone = useIsStandalone();

  // Registra o Service Worker somente em produção e HTTPS.
  // Em desenvolvimento, remove qualquer SW existente para evitar cache de chunks e 404.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isDev = process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost';

    if (isDev) {
      // Unregister SWs em dev para evitar servir assets antigos com MIME incorreto
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      }).catch(() => {});
      return;
    }

    // Produção: registra quando a página carrega
    const onLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => {
            fetch('/api/telemetry/logsnag', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ channel: 'pwa', event: 'SW Registered', icon: '⚙️' }),
            }).catch(() => {})
          })
          .catch(() => {
            // ignora erros de registro silenciosamente
          });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Captura beforeinstallprompt (Android/Chrome)
  React.useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem(DISMISS_KEY)) setShowBar(true);
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'pwa', event: 'Install Prompt', icon: '📣' }),
      }).catch(() => {})
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const onInstalled = () => {
      setDeferred(null);
      setShowBar(false);
      setOpen(false);
      fetch('/api/telemetry/logsnag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'pwa', event: 'PWA Installed', icon: '📲' }),
      }).catch(() => {})
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Não mostra nada se já estiver instalado ou se o usuário dispensou
  if (standalone || typeof window === "undefined") return null;
  if (localStorage.getItem(DISMISS_KEY)) return null;

  const androidAvailable = !!deferred;
  const onInstallClick = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") {
        // mantém a barra para permitir tentar novamente
      } else {
        setShowBar(false);
      }
    } catch {
      // Ignora erros silenciosamente
    }
  };

  const onDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShowBar(false);
    setOpen(false);
  };

  return (
    <>
      {/* Barra inferior para convite de instalação */}
      {(androidAvailable || isIOS()) && showBar && (
        <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto max-w-xl rounded-md border bg-background/95 backdrop-blur shadow-lg p-3 sm:p-3.5 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-sm font-medium">Instale o app na sua tela inicial</div>
            <div className="text-xs text-muted-foreground">Acesse mais rápido e em modo standalone</div>
          </div>
          {androidAvailable ? (
            <Button size="sm" onClick={onInstallClick}>Instalar</Button>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)}>Como instalar</Button>
          )}
          <Button size="icon-sm" variant="ghost" aria-label="Fechar" onClick={onDismiss}>
            ×
          </Button>
        </div>
      )}

      {/* Modal com instruções para iOS */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar à Tela de Início</DialogTitle>
            <DialogDescription>
              Para iPhone/iPad (Safari):
              <ol className="mt-3 space-y-2 list-decimal list-inside text-foreground">
                <li>Toque no botão Compartilhar (ícone de quadrado com seta).</li>
                <li>Escolha &quot;Adicionar à Tela de Início&quot;.</li>
                <li>Confirme o nome e toque em Adicionar.</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onDismiss}>Não mostrar novamente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
