"use client";

import { CalendarDays, LogOut, Pencil, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/AuthProvider";
import { HabitBars } from "@/components/HabitBars";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { Avatar, Button, Card, Tag } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { resetDemo } from "@/lib/data/demoRepo";
import { personalityOf, toVector } from "@/lib/quiz";
import type { Profile } from "@/lib/types";

function EditLink({ step, label }: { step: string; label: string }) {
  return (
    <Link href={`/onboarding?edit=${step}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
      <Pencil size={13} /> {label}
    </Link>
  );
}

function Me({ me }: { me: Profile }) {
  const router = useRouter();
  const repo = getRepo();
  const v = toVector(me.quizAnswers!);
  const p = personalityOf(v);

  async function logout() {
    await repo.signOut();
    router.replace("/");
  }

  function reset() {
    if (!window.confirm("Hapus semua data demo di browser ini dan mulai dari awal?")) return;
    resetDemo();
    window.location.href = "/";
  }

  return (
    <AppShell me={me.id} title="Profil kamu" action={<EditLink step="profile" label="Edit" />}>
      <div className="flex items-center gap-4">
        <Avatar name={me.fullName} size={64} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{me.fullName}</h2>
          <p className="truncate text-sm text-muted">
            {me.studyProgram || "Mahasiswa"} · {me.university}
          </p>
          <p className="truncate text-xs text-faint">{me.city}</p>
        </div>
      </div>
      {me.bio && <p className="mt-4 text-[15px] leading-relaxed">{me.bio}</p>}
      {me.courses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {me.courses.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
              <Sparkles size={14} /> Study personality
            </p>
            <p className="mt-1 text-lg font-bold">{p.name}</p>
          </div>
          <EditLink step="quiz" label="Ulangi kuis" />
        </div>
        <p className="mt-1 text-sm text-muted">{p.description}</p>
        <div className="mt-4">
          <HabitBars mine={v} />
        </div>
      </Card>

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarDays size={16} /> Waktu luang
          </p>
          <EditLink step="schedule" label="Ubah" />
        </div>
        <ScheduleGrid value={me.availability} />
      </Card>

      <div className="mt-6 space-y-3">
        <Button variant="secondary" block onClick={logout}>
          <LogOut size={16} /> Keluar
        </Button>
        {repo.mode === "demo" && (
          <Button variant="danger" block onClick={reset}>
            <RotateCcw size={16} /> Reset data demo
          </Button>
        )}
      </div>
    </AppShell>
  );
}

export default function MePage() {
  return <RequireProfile>{(me) => <Me me={me} />}</RequireProfile>;
}
