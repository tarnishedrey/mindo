"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/AuthProvider";
import { ConnectButton } from "@/components/ConnectButton";
import { DemoNotice } from "@/components/DemoNotice";
import { Avatar, Card, Chip, EmptyState, ErrorNote, ScoreRing, Spinner, Tag } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { useConns } from "@/lib/hooks";
import { rank, type Scope } from "@/lib/matching";
import { personalityOf, toVector } from "@/lib/quiz";
import type { Profile } from "@/lib/types";

const scopes: { key: Scope; label: string }[] = [
  { key: "kampus", label: "Kampusku" },
  { key: "kota", label: "Kotaku" },
  { key: "semua", label: "Semua kampus" },
];

function Discover({ me }: { me: Profile }) {
  const [others, setOthers] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");
  const [scope, setScope] = useState<Scope>("kota");
  const conns = useConns(me.id);

  useEffect(() => {
    getRepo()
      .listProfiles()
      .then(setOthers)
      .catch(() => setError("Daftar mahasiswa gagal dimuat. Periksa koneksi internetmu."));
  }, []);

  const matches = useMemo(() => (others ? rank(me, others, scope) : []), [me, others, scope]);
  const personality = personalityOf(toVector(me.quizAnswers!));

  return (
    <AppShell
      me={me.id}
      title={`Halo, ${me.fullName.split(" ")[0]}`}
      subtitle={`Study personality: ${personality.name}`}
    >
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Jangkauan">
        {scopes.map((s) => (
          <Chip key={s.key} active={scope === s.key} onClick={() => setScope(s.key)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted">
        <MapPin size={13} />
        {scope === "kampus" ? me.university : scope === "kota" ? `Kampus di ${me.city}` : "Seluruh Indonesia"} · diurutkan dari yang paling cocok
      </p>

      <div className="mt-4 space-y-3">
        <ErrorNote>{error}</ErrorNote>
        {!others && !error && <Spinner label="Mencari teman belajar…" />}
        {others && matches.length === 0 && (
          <EmptyState
            title="Belum ada yang cocok di sini"
            body={scope === "semua" ? "Belum ada mahasiswa lain yang mengisi kuis." : "Coba perluas jangkauan pencarian."}
            action={
              scope !== "semua" && (
                <Chip active onClick={() => setScope(scope === "kampus" ? "kota" : "semua")}>
                  {scope === "kampus" ? "Lihat se-kota" : "Lihat semua kampus"}
                </Chip>
              )
            }
          />
        )}
        {matches.map((m) => {
          const p = m.profile;
          return (
            <Card key={p.id} className="animate-rise">
              <Link href={`/profile/${p.id}`} className="flex gap-3">
                <Avatar name={p.fullName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink">{p.fullName}</p>
                    {p.isSample && <Tag>Contoh</Tag>}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {p.studyProgram || "Mahasiswa"} · {p.university}
                  </p>
                  <p className="mt-1 text-xs font-medium text-brand-strong">{personalityOf(toVector(p.quizAnswers!)).name}</p>
                </div>
                <ScoreRing score={m.score} />
              </Link>
              {m.reasons.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-line pt-3">
                  {m.reasons.slice(0, 2).map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] text-muted">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex justify-end">
                <ConnectButton
                  compact
                  otherId={p.id}
                  state={conns.stateWith(p.id)}
                  connection={conns.withUser(p.id)}
                  onChange={conns.reload}
                />
              </div>
            </Card>
          );
        })}
        {others && matches.length > 0 && (
          <div className="pt-3">
            <DemoNotice />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function DiscoverPage() {
  return <RequireProfile>{(me) => <Discover me={me} />}</RequireProfile>;
}
