"use client";
import App from "@/App";
import { playClickSound } from "@/lib/soundEffects";
import { AppProviders } from "@/providers";
import React, { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

export default function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactiveElement = target.closest(
        'button, a, input[type="radio"], input[type="checkbox"], select, [role="button"], [role="tab"]'
      );

      if (interactiveElement) {
        playClickSound();
      }
    }

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  );
}
