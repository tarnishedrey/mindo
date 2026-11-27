"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { PlainShell } from "@/components/AppShell";
import { HabitBars } from "@/components/HabitBars";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { TagInput } from "@/components/TagInput";
import { Button, Card, ErrorNote, Field, Input, Spinner, Textarea, cx } from "@/components/ui";
import { getRepo, RepoError, type ProfileInput } from "@/lib/data";
import { personalityOf, questions, scale, toVector } from "@/lib/quiz";

type Step = "profile" | "schedule" | "quiz" | "result";
const order: Step[] = ["profile", "schedule", "quiz", "result"];

const campuses = [
  "Universitas Brawijaya",
  "Universitas Negeri Malang",
  "Universitas Indonesia",
  "Institut Teknologi Bandung",
  "Universitas Airlangga",
  "Institut Teknologi Sepuluh Nopember",
  "Universitas Padjadjaran",
  "Universitas Gadjah Mada",
  "Universitas Diponegoro",
  "Universitas Jember",
  "Universitas Lampung",
];

const empty: ProfileInput = {
  fullName: "",
  university: "",
  city: "",
  faculty: "",
  studyProgram: "",
  year: 1,
  bio: "",
  courses: [],
  availability: [],
  quizAnswers: null,
};

function Onboarding() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const editStep = params.get("edit") as Step | null;
  const editing = !!editStep && !!profile?.quizAnswers;

  const [step, setStep] = useState<Step>("profile");
  const [form, setForm] = useState<ProfileInput>(empty);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [qIndex, setQIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (hydrated) return;
    if (profile) {
      const { id: _id, createdAt: _c, isSample: _s, ...rest } = profile;
      setForm(rest);
      if (profile.quizAnswers) setAnswers(profile.quizAnswers);
    }
    if (editStep && order.includes(editStep)) setStep(editStep);
    setHydrated(true);
  }, [loading, user, profile, editStep, hydrated, router]);

  if (loading || !user || !hydrated) return <Spinner />;

  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(next: ProfileInput) {
    setBusy(true);
    setError("");
    try {
      await getRepo().saveMe(next);
      await refreshProfile();
      return true;
    } catch (e) {
      setError(e instanceof RepoError ? e.message : "Gagal menyimpan. Coba lagi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function finishEdit(next: ProfileInput) {
    if (await save(next)) router.replace("/me");
  }

  function submitProfile(e: FormEvent) {
    e.preventDefault();
    if (form.fullName.trim().length < 2) return setError("Isi nama lengkapmu.");
    if (!form.university.trim() || !form.city.trim()) return setError("Isi kampus dan kota.");
    setError("");
    if (editing) return void finishEdit(form);
    setStep("schedule");
  }

  function submitSchedule() {
    if (form.availability.length === 0) return setError("Pilih minimal satu waktu luang.");
    setError("");
    if (editing) return void finishEdit(form);
    setQIndex(0);
    setStep("quiz");
  }

  async function answer(value: number) {
    const next = [...answers];
    next[qIndex] = value;
    setAnswers(next);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      return;
    }
    const complete = { ...form, quizAnswers: next as number[] };
    setForm(complete);
    if (await save(complete)) setStep("result");
  }

  const stepNo = order.indexOf(step);
  const back = () => {
    setError("");
    if (step === "quiz" && qIndex > 0) return setQIndex(qIndex - 1);
    if (editing || stepNo === 0) return router.back();
    setStep(order[stepNo - 1]);
  };

  return (
    <PlainShell>
      {step !== "result" && (
        <header className="px-4 pt-4">
          <div className="flex items-center gap-2">
            <button onClick={back} className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="Kembali">
              <ArrowLeft size={22} />
            </button>
            {!editing && (
              <div className="flex flex-1 gap-1.5" aria-label={`Langkah ${stepNo + 1} dari 3`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={cx("h-1.5 flex-1 rounded-full", i <= stepNo ? "bg-brand" : "bg-line")} />
                ))}
              </div>
            )}
          </div>
        </header>
      )}

      <div className="flex flex-1 flex-col px-6 pb-8 pt-4">
        {step === "profile" && (
          <form onSubmit={submitProfile} className="flex flex-1 flex-col">
            <h1 className="text-2xl font-bold">Kenalan dulu</h1>
            <p className="mt-1 text-sm text-muted">Profil ini yang dilihat calon teman belajarmu.</p>
            <div className="mt-6 space-y-4">
              <Field label="Nama lengkap">
                <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" required />
              </Field>
              <Field label="Kampus">
                <Input list="universities" value={form.university} onChange={(e) => set("university", e.target.value)} placeholder="Universitas Brawijaya" required />
                <datalist id="universities">
                  {campuses.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Field>
              <Field label="Kota kampus" hint="Dipakai untuk menampilkan teman belajar di kotamu.">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Malang" required />
              </Field>
              <div className="grid grid-cols-[1fr_6.5rem] gap-3">
                <Field label="Program studi">
                  <Input value={form.studyProgram} onChange={(e) => set("studyProgram", e.target.value)} placeholder="Sains Data" />
                </Field>
                <Field label="Tahun ke-">
                  <Input type="number" min={1} max={8} value={form.year} onChange={(e) => set("year", Math.min(8, Math.max(1, Number(e.target.value) || 1)))} />
                </Field>
              </div>
              <Field label="Fakultas">
                <Input value={form.faculty} onChange={(e) => set("faculty", e.target.value)} placeholder="Fakultas Sains Teknologi dan Matematika" />
              </Field>
              <Field label="Mata kuliah yang ingin dipelajari bareng">
                <TagInput value={form.courses} onChange={(v) => set("courses", v)} />
              </Field>
              <Field label="Tentang kamu (opsional)">
                <Textarea value={form.bio} maxLength={280} onChange={(e) => set("bio", e.target.value)} placeholder="Contoh: Lagi berjuang di Kalkulus, suka bikin rangkuman." />
              </Field>
            </div>
            <div className="mt-8 space-y-3">
              <ErrorNote>{error}</ErrorNote>
              <Button type="submit" block disabled={busy}>
                {editing ? "Simpan" : "Lanjut"}
              </Button>
            </div>
          </form>
        )}

        {step === "schedule" && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-2xl font-bold">Kapan kamu biasanya luang?</h1>
            <p className="mt-1 text-sm text-muted">Pilih semua waktu yang biasanya bisa dipakai belajar bareng.</p>
            <div className="mt-6">
              <ScheduleGrid value={form.availability} onChange={(v) => set("availability", v)} />
            </div>
            <p className="mt-3 text-xs text-muted">{form.availability.length} waktu dipilih</p>
            <div className="mt-auto space-y-3 pt-8">
              <ErrorNote>{error}</ErrorNote>
              <Button block onClick={submitSchedule} disabled={busy}>
                {editing ? "Simpan" : "Lanjut ke kuis"}
              </Button>
            </div>
          </div>
        )}

        {step === "quiz" && (
          <div key={qIndex} className="animate-rise flex flex-1 flex-col">
            <p className="text-sm font-medium text-brand">
              Kuis cara belajar · {qIndex + 1}/{questions.length}
            </p>
            <h1 className="mt-3 text-[22px] font-bold leading-snug">{questions[qIndex].text}</h1>
            <div className="mt-8 space-y-2.5">
              {scale.map((s) => (
                <button
                  key={s.value}
                  disabled={busy}
                  onClick={() => void answer(s.value)}
                  className={cx(
                    "flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left text-[15px] font-medium transition-colors",
                    answers[qIndex] === s.value ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink hover:border-brand",
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-sm text-muted">{s.value}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <ErrorNote>{error}</ErrorNote>
            </div>
          </div>
        )}

        {step === "result" && form.quizAnswers && (
          <Result answers={form.quizAnswers} onDone={() => router.replace(editing ? "/me" : "/discover")} editing={editing} />
        )}
      </div>
    </PlainShell>
  );
}

function Result({ answers, onDone, editing }: { answers: number[]; onDone: () => void; editing: boolean }) {
  const v = toVector(answers);
  const p = personalityOf(v);
  return (
    <div className="animate-rise flex flex-1 flex-col">
      <p className="text-sm font-medium text-brand">Study personality kamu</p>
      <h1 className="mt-2 text-[28px] font-bold leading-tight">{p.name}</h1>
      <p className="mt-2 text-[15px] text-muted">{p.description}</p>
      <Card className="mt-6">
        <HabitBars mine={v} />
      </Card>
      <p className="mt-4 text-xs text-muted">
        Mindo mencocokkanmu dengan mahasiswa yang kebiasaannya mirip dan jadwal luangnya sama. Kuis bisa diulang kapan
        saja dari halaman profil.
      </p>
      <div className="mt-auto pt-8">
        <Button block onClick={onDone}>
          {editing ? "Kembali ke profil" : "Lihat rekomendasi teman belajar"}
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Onboarding />
    </Suspense>
  );
}
