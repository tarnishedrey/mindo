"use client";

import { ArrowLeft, BookOpen, GraduationCap, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlainShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/AuthProvider";
import { ConnectButton } from "@/components/ConnectButton";
import { HabitBars } from "@/components/HabitBars";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { Avatar, Card, EmptyState, ScoreRing, Spinner, Tag } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { useConns } from "@/lib/hooks";
import { scoreMatch, weights } from "@/lib/matching";
import { personalityOf, toVector } from "@/lib/quiz";
import type { Profile } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Bar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="text-muted">
          {Math.round(value * 100)}% · bobot {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-canvas">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

function ProfileView({ me }: { me: Profile }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [other, setOther] = useState<Profile | null | undefined>(undefined);
  const conns = useConns(me.id);

  useEffect(() => {
    getRepo().getProfile(id).then(setOther).catch(() => setOther(null));
  }, [id]);

  if (other === undefined) return <Spinner />;
  if (!other) return <EmptyState title="Profil tidak ditemukan" body="Mungkin akunnya sudah dihapus." />;

  const match = scoreMatch(me, other);
  const isMe = other.id === me.id;
  const first = other.fullName.split(" ")[0];

  return (
    <PlainShell>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur">
        <button onClick={() => router.back()} className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="Kembali">
          <ArrowLeft size={22} />
        </button>
        <p className="font-semibold">Profil</p>
      </header>

      <div className="flex-1 px-4 pb-32 pt-5">
        <div className="flex items-center gap-4">
          <Avatar name={other.fullName} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-bold">{other.fullName}</h1>
              {other.isSample && <Tag>Contoh</Tag>}
            </div>
            {other.quizAnswers && <p className="text-sm font-medium text-brand-strong">{personalityOf(toVector(other.quizAnswers)).name}</p>}
          </div>
          {match && !isMe && <ScoreRing score={match.score} size={64} />}
        </div>

        <div className="mt-4 space-y-1.5 text-sm text-muted">
          <p className="flex items-center gap-2">
            <GraduationCap size={16} /> {other.studyProgram || "Mahasiswa"}, tahun ke-{other.year}
          </p>
          <p className="flex items-center gap-2">
            <MapPin size={16} /> {other.university}, {other.city}
          </p>
        </div>
        {other.bio && <p className="mt-4 text-[15px] leading-relaxed text-ink">{other.bio}</p>}

        {match && !isMe && (
          <Section title="Kenapa kalian cocok">
            <Card className="space-y-4">
              <Bar label="Kebiasaan belajar" value={match.parts.habits} weight={weights.habits} />
              <Bar label="Waktu luang" value={match.parts.schedule} weight={weights.schedule} />
              <Bar label="Mata kuliah" value={match.parts.courses} weight={weights.courses} />
              {match.reasons.length > 0 && (
                <ul className="space-y-1 border-t border-line pt-3">
                  {match.reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] text-muted">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>
        )}

        {other.quizAnswers && (
          <Section title="Cara belajar">
            <Card>
              <HabitBars mine={toVector(me.quizAnswers!)} other={isMe ? undefined : toVector(other.quizAnswers)} otherName={first} />
            </Card>
          </Section>
        )}

        <Section title={`Waktu luang ${first}`}>
          <Card>
            <ScheduleGrid value={other.availability} highlight={isMe ? [] : match?.sharedSlots} />
            {!isMe && match && match.sharedSlots.length > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted">
                <span className="h-3 w-3 rounded bg-accent" /> Waktu luang yang sama denganmu
              </p>
            )}
          </Card>
        </Section>

        {other.courses.length > 0 && (
          <Section title="Mata kuliah">
            <div className="flex flex-wrap gap-2">
              {other.courses.map((c) => (
                <Tag key={c} tone={match?.sharedCourses.includes(c) ? "accent" : "neutral"}>
                  <BookOpen size={12} className="mr-1" /> {c}
                </Tag>
              ))}
            </div>
          </Section>
        )}
      </div>

      {!isMe && (
        <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            <ConnectButton otherId={other.id} state={conns.stateWith(other.id)} connection={conns.withUser(other.id)} onChange={conns.reload} />
          </div>
        </div>
      )}
    </PlainShell>
  );
}

export default function ProfilePage() {
  return <RequireProfile>{(me) => <ProfileView me={me} />}</RequireProfile>;
}
