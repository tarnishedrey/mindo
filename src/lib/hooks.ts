"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepo } from "./data";
import type { Connection, Profile } from "./types";

export type ConnectionState = "none" | "sent" | "incoming" | "connected" | "declined";

export function useConns(me: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      setConnections(await getRepo().listConns());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void reload();
    return getRepo().onConnsChange(() => void reload());
  }, [reload]);

  const withUser = (otherId: string) =>
    connections.find(
      (c) => (c.requesterId === me && c.addresseeId === otherId) || (c.requesterId === otherId && c.addresseeId === me),
    );

  const stateWith = (otherId: string): ConnectionState => {
    const c = withUser(otherId);
    if (!c) return "none";
    if (c.status === "accepted") return "connected";
    if (c.status === "declined") return "declined";
    return c.requesterId === me ? "sent" : "incoming";
  };

  const incoming = connections.filter((c) => c.addresseeId === me && c.status === "pending");

  return { connections, loaded, reload, withUser, stateWith, incoming };
}

export function useProfiles(ids: string[]) {
  const [map, setMap] = useState<Record<string, Profile>>({});
  const key = [...new Set(ids)].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let alive = true;
    (async () => {
      const entries = await Promise.all(key.split(",").map(async (id) => [id, await getRepo().getProfile(id)] as const));
      if (alive) setMap(Object.fromEntries(entries.filter(([, p]) => p)) as Record<string, Profile>);
    })();
    return () => {
      alive = false;
    };
  }, [key]);

  return map;
}
