"use client";

import { useEffect } from "react";
import { initHome } from "./home-effects";

export function HomeEffects() {
  useEffect(() => {
    const controller = new AbortController();
    initHome(controller.signal);
    return () => controller.abort();
  }, []);
  return null;
}
