"use client";

import Pusher from "pusher-js";
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { SOKETI } from "@/config/env";

type PusherContextProps = {
  subscribe: {
    <T>(scope: "connection", event: string, callback: (data: T) => void): () => void;
    <T>(scope: "channel", channel: string, event: string, callback: (data: T) => void): () => void;
  };
  unsubscribe: {
    (scope: "channel", channel: string): void;
    (scope: "connection", event: string): void;
  };
  connect: { (): void };
  disconnect: { (): void };
};

const PusherContext = createContext<PusherContextProps>({
  subscribe: () => () => undefined,
  unsubscribe: () => undefined,
  connect: () => undefined,
  disconnect: () => undefined,
});

export const PusherProvider = ({ children }: PropsWithChildren) => {
  const pusherRef = useRef<Pusher | null>(null);

  // Initialize the Pusher client on the client side.
  if (typeof window !== "undefined" && pusherRef.current === null) {
    console.debug("[Realtime] Initializing Pusher client …");
    pusherRef.current = new Pusher(SOKETI.APP_KEY, {
      wsHost: SOKETI.ADDRESS,
      enabledTransports: ["ws", "wss"],
      disableStats: true,
      cluster: "local",
    });
  }

  // Subscribe to a channel or connection event using the Pusher client.
  const subscribe = useCallback<PusherContextProps["subscribe"]>(
    (scope: "channel" | "connection", a: string, b?: string | ((data: never) => void), c?: (data: never) => void) => {
      if (!pusherRef.current) return () => {};

      if (scope === "connection") {
        console.debug(`[Realtime] Subscribing to connection event: ${a}`);
        pusherRef.current.connection.bind(a, b as (data: never) => void);
        return () => {
          pusherRef.current?.connection.unbind(a, b as (data: never) => void);
        };
      } else {
        console.debug(`[Realtime] Subscribing to channel event: ${a}:${b}`);
        const subscription = pusherRef.current.subscribe(a);
        subscription.bind(b as string, c as (data: never) => void);
        return () => {
          subscription.unbind(b as string, c as (data: never) => void);
        };
      }
    },
    [],
  );

  // Unsubscribe from a channel or connection event using the Pusher client.
  const unsubscribe = useCallback<PusherContextProps["unsubscribe"]>(
    (scope: "channel" | "connection", name: string) => {
      if (!pusherRef.current) return () => {};
      if (scope === "connection") {
        console.debug(`[Realtime] Unsubscribing from connection event: ${name}`);
        pusherRef.current.connection.unbind(name);
      } else {
        console.debug(`[Realtime] Unsubscribing from channel: ${name}`);
        pusherRef.current.unsubscribe(name);
      }
    },
    [],
  );

  // Manually connect to the Pusher client.
  const connect = useCallback<PusherContextProps["connect"]>(() => {
    if (!pusherRef.current) return;
    console.debug("[Realtime] Manually connecting to Pusher client …");
    pusherRef.current.connect();
  }, []);

  // Manually disconnect from the Pusher client.
  const disconnect = useCallback<PusherContextProps["disconnect"]>(() => {
    if (!pusherRef.current) return;
    console.debug("[Realtime] Manually disconnecting from Pusher client …");
    pusherRef.current.disconnect();
  }, []);

  useEffect(() => {
    // Disconnect the Pusher client when the component is unmounted to prevent memory leaks.
    return () => {
      if (pusherRef.current) {
        console.debug("[Realtime] Disconnecting Pusher client …");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [subscribe]);

  // Memoize the context values to prevent unnecessary re-renders and return the provider.
  const values = useMemo(
    () => ({ subscribe, unsubscribe, connect, disconnect }),
    [subscribe, unsubscribe, connect, disconnect],
  );
  return <PusherContext.Provider value={values}>{children}</PusherContext.Provider>;
};

export const usePusher = () => {
  const context = useContext(PusherContext);
  if (!context) throw new Error("usePusher must be used within a PusherProvider");
  return context;
};

export type ConnectionStatus = "initialized" | "connecting" | "connected" | "unavailable" | "failed";
export type ConnectionStatusChange = { previous: ConnectionStatus; current: ConnectionStatus };
