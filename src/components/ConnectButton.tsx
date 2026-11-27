"use client";

import { Check, Clock, MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getRepo, RepoError } from "@/lib/data";
import type { ConnectionState } from "@/lib/hooks";
import type { Connection } from "@/lib/types";
import { Button, cx } from "./ui";

export function ConnectButton({
  otherId,
  state,
  connection,
  compact,
  onChange,
}: {
  otherId: string;
  state: ConnectionState;
  connection?: Connection;
  compact?: boolean;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const size = compact ? ("sm" as const) : ("md" as const);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChange();
    } catch (e) {
      setError(e instanceof RepoError ? e.message : "Gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  let control;
  if (state === "connected" && connection) {
    control = (
      <Link
        href={`/chat/${connection.id}`}
        className={cx("inline-flex items-center justify-center gap-2 rounded-xl bg-ok font-semibold text-white", compact ? "h-10 px-4 text-[13px]" : "h-12 w-full px-5 text-sm")}
      >
        <MessageCircle size={16} /> Chat
      </Link>
    );
  } else if (state === "sent") {
    control = (
      <Button variant="secondary" disabled size={size} block={!compact}>
        <Clock size={16} /> Menunggu
      </Button>
    );
  } else if (state === "incoming" && connection) {
    control = (
      <Button size={size} block={!compact} disabled={busy} onClick={() => act(() => getRepo().respond(connection.id, true))}>
        <Check size={16} /> Terima ajakan
      </Button>
    );
  } else if (state === "declined") {
    control = (
      <Button variant="secondary" disabled size={size} block={!compact}>
        Tidak terhubung
      </Button>
    );
  } else {
    control = (
      <Button size={size} block={!compact} disabled={busy} onClick={() => act(() => getRepo().connect(otherId))}>
        <UserPlus size={16} /> {busy ? "Mengirim…" : "Ajak belajar"}
      </Button>
    );
  }

  return (
    <div className={cx(!compact && "w-full")}>
      {control}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
