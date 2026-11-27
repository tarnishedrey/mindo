"use client";

import { Check, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/AuthProvider";
import { Avatar, Button, ButtonLink, Card, EmptyState, Spinner, Tag } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { useConns, useProfiles } from "@/lib/hooks";
import { scoreMatch } from "@/lib/matching";
import type { Connection, Profile } from "@/lib/types";

function Connections({ me }: { me: Profile }) {
  const { connections, loaded, reload, incoming } = useConns(me.id);
  const otherId = (c: Connection) => (c.requesterId === me.id ? c.addresseeId : c.requesterId);
  const people = useProfiles(connections.map(otherId));
  const [busy, setBusy] = useState<string | null>(null);

  const friends = connections.filter((c) => c.status === "accepted");
  const sent = connections.filter((c) => c.status === "pending" && c.requesterId === me.id);

  async function respond(c: Connection, accept: boolean) {
    setBusy(c.id);
    try {
      await getRepo().respond(c.id, accept);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  const Row = ({ c, right, href }: { c: Connection; right?: React.ReactNode; href: string }) => {
    const p = people[otherId(c)];
    const score = p ? scoreMatch(me, p)?.score : undefined;
    return (
      <Card className="flex items-center gap-3 p-3">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={p?.fullName ?? "?"} size={44} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{p?.fullName ?? "Memuat…"}</p>
              {p?.isSample && <Tag>Contoh</Tag>}
            </div>
            <p className="truncate text-xs text-muted">
              {p?.university}
              {score !== undefined && ` · ${score}% cocok`}
            </p>
          </div>
        </Link>
        {right}
      </Card>
    );
  };

  return (
    <AppShell me={me.id} title="Koneksi" subtitle="Ajakan dan teman belajarmu">
      {!loaded && <Spinner />}
      {loaded && connections.length === 0 && (
        <EmptyState
          title="Belum ada koneksi"
          body="Cari mahasiswa yang cocok, lalu kirim ajakan belajar."
          action={<ButtonLink href="/discover">Cari teman belajar</ButtonLink>}
        />
      )}

      {incoming.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Ajakan masuk · {incoming.length}</h2>
          <div className="space-y-2">
            {incoming.map((c) => (
              <Row
                key={c.id}
                c={c}
                href={`/profile/${otherId(c)}`}
                right={
                  <div className="flex gap-1.5">
                    <Button variant="danger" size="icon" aria-label="Tolak" disabled={busy === c.id} onClick={() => respond(c, false)}>
                      <X size={18} />
                    </Button>
                    <Button size="icon" aria-label="Terima" disabled={busy === c.id} onClick={() => respond(c, true)}>
                      <Check size={18} />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      {friends.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Teman belajar · {friends.length}</h2>
          <div className="space-y-2">
            {friends.map((c) => (
              <Row key={c.id} c={c} href={`/chat/${c.id}`} right={<ChevronRight size={20} className="text-faint" />} />
            ))}
          </div>
        </section>
      )}

      {sent.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Menunggu balasan · {sent.length}</h2>
          <div className="space-y-2">
            {sent.map((c) => (
              <Row key={c.id} c={c} href={`/profile/${otherId(c)}`} right={<Tag>Terkirim</Tag>} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

export default function ConnectionsPage() {
  return <RequireProfile>{(me) => <Connections me={me} />}</RequireProfile>;
}
