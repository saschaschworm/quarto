"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { tv } from "tailwind-variants";

import { ConnectionStatusChange, usePusher } from "@/providers/pusher";

import { HorizontalLoadingDots } from "./horizontal-loading-dots";

const style = tv({
  slots: {
    container: "flex flex-row items-center justify-between gap-x-4 border-b px-8 py-2",
    label: "line-clamp-1 text-xs leading-6 font-medium tracking-widest uppercase",
    indicator: "",
    button: "-mr-2 cursor-pointer rounded-sm px-1.5 text-xs leading-6 font-medium tracking-widest",
  },
  variants: {
    variant: {
      neutral: { container: "border-slate-200 bg-slate-100", button: "text-neutral-400 hover:bg-neutral-200/50" },
      success: { container: "border-lime-200 bg-lime-100", button: "text-lime-400 hover:bg-lime-200/50" },
      warning: { container: "border-amber-200 bg-amber-100", button: "text-amber-400 hover:bg-amber-200/50" },
      error: { container: "border-rose-200 bg-rose-100", button: "text-red-400 hover:bg-rose-200/50" },
    },
  },
  compoundSlots: [
    { slots: ["label", "indicator"], variant: "neutral", class: "text-slate-600" },
    { slots: ["label", "indicator"], variant: "success", class: "text-lime-600" },
    { slots: ["label", "indicator"], variant: "warning", class: "text-amber-600" },
    { slots: ["label", "indicator"], variant: "error", class: "text-rose-600" },
  ],
  defaultVariants: { variant: "neutral" },
});

export const ConnectionStatusBar = () => {
  const t = useTranslations();
  const { subscribe, unsubscribe } = usePusher();

  // Initialize the state of the connection status bar.
  const [state, dispatch] = useState<ConnectionStatusChange & { visible: boolean }>({
    previous: "initialized",
    current: "connecting",
    visible: true,
  });

  // Determine the message and variant based on the connection state. The message will be displayed in the status bar
  // and the variant will determine the color of the status bar.
  const { variant, message } = useMemo(() => {
    const messages: Record<string, { variant: keyof typeof style.variants.variant; message: string }> = {
      "initialized:connecting": { variant: "neutral", message: t("realtime.notifications.connecting") },
      "connecting:connected": { variant: "success", message: t("realtime.notifications.connected") },
      "connecting:unavailable": { variant: "error", message: t("realtime.notifications.unavailable") },
      "connected:connecting": { variant: "warning", message: t("realtime.notifications.reconnecting") },
      "unavailable:connected": { variant: "success", message: t("realtime.notifications.connected") },
    };
    const key = `${state.previous}:${state.current}`;
    return messages[key] || { status: "error", message: t("realtime.notifications.exception") };
  }, [state, t]);
  const styles = useMemo(() => style({ variant }), [variant]);

  useEffect(() => {
    // Subscribe to connection state changes. This will trigger the visibility of the status bar based on the
    // connection state. The status bar will be visible for 3 seconds after the connection is established.
    subscribe<ConnectionStatusChange>("connection", "state_change", (data) => {
      dispatch((state) => {
        if (data.current === "connected") setTimeout(() => dispatch((state) => ({ ...state, visible: false })), 3000);
        return { ...state, ...data, visible: true };
      });
    });

    return () => {
      // Unsubscribe from connection state changes when the component is unmounted.
      unsubscribe("connection", "state_change");
    };
  }, [subscribe, unsubscribe]);

  return (
    <>
      <AnimatePresence initial={false}>
        {state.visible && (
          <motion.div
            className={styles.container()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className={styles.label()}>{message}</span>
            <div className="flex items-center justify-end">
              {(state.previous === "initialized" || state.previous === "connected") &&
                state.current === "connecting" && <HorizontalLoadingDots className={styles.indicator()} />}
              {state.current !== "connecting" && state.current !== "connected" && (
                <button onClick={() => window.location.reload()} className={styles.button()}>
                  RELOAD
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
