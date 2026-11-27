"use client";

import { CalendarCheck, MessagesSquare, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { isCampus } from "@/lib/campus";
import { demoAccount, getRepo, RepoError } from "@/lib/data";
import { PlainShell } from "./AppShell";
import { useAuth } from "./AuthProvider";
import { DemoNotice } from "./DemoNotice";
import { Logo } from "./Logo";
import { Button, ErrorNote, Field, Input, Spinner } from "./ui";

const steps = [
  { icon: Sparkles, title: "Isi kuis 2 menit", body: "8 pertanyaan tentang cara belajarmu." },
  { icon: CalendarCheck, title: "Dapat rekomendasi", body: "Diurutkan dari kebiasaan dan jadwal yang paling cocok." },
  { icon: MessagesSquare, title: "Ajak belajar bareng", body: "Ngobrol dan atur sesi belajar dari chat." },
];

const demoJudge = { email: "juri@demo.mindo.test", password: "mindo-demo" };
const demoPass = "mindo-demo-local";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/discover";
  const { user, profile, loading } = useAuth();
  const repo = getRepo();
  const isDemo = repo.mode === "demo";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const flag = params.get("error");
  const [busy, setBusy] = useState(false);

  const judge = isDemo ? demoJudge : demoAccount.email ? demoAccount : null;

  useEffect(() => {
    if (flag === "campus") {
      setError("Akun itu bukan akun kampus. Masuk dengan akun Google kampus (email berakhiran .ac.id), misalnya nama@student.ub.ac.id.");
      setBusy(false);
    }
  }, [flag]);

  useEffect(() => {
    if (!loading && user) router.replace(profile?.quizAnswers ? next : "/onboarding");
  }, [loading, user, profile, next, router]);

  async function run(fn: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof RepoError ? e.message : "Terjadi kesalahan. Coba lagi sebentar.");
      setBusy(false);
    }
  }

  const google = () => run(() => repo.signInGoogle(next));

  function demoLogin(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      if (!isCampus(email)) throw new RepoError("Gunakan email kampus yang berakhiran .ac.id.");
      try {
        await repo.signIn(email, demoPass);
      } catch {
        await repo.signUp(email, demoPass);
      }
    });
  }

  function judgeLogin() {
    if (!judge) return;
    void run(async () => {
      try {
        await repo.signIn(judge.email, judge.password);
      } catch (e) {
        if (!isDemo) throw e;
        await repo.signUp(judge.email, judge.password);
      }
    });
  }

  if (loading || user) return <Spinner />;

  return (
    <PlainShell>
      <div className="flex flex-1 flex-col px-6 pb-8 pt-10">
        <Logo />

        <section className="mt-10">
          <h1 className="text-[28px] font-bold leading-tight text-ink">
            Temukan teman belajar yang <span className="text-brand">cara belajarnya cocok</span> denganmu.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Mindo mempertemukanmu dengan mahasiswa yang kebiasaan belajarnya sejalan, supaya belajar bareng terasa nyaman.
          </p>
        </section>

        <ol className="mt-8 space-y-4">
          {steps.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-[13px] text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-auto space-y-3 pt-10">
          <ErrorNote>{error}</ErrorNote>

          {isDemo ? (
            <form onSubmit={demoLogin} className="space-y-3">
              <Field label="Email kampus" hint="Mode demo: login Google disimulasikan, cukup isi email .ac.id.">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@student.ub.ac.id" />
              </Field>
              <Button type="submit" variant="secondary" block disabled={busy}>
                <GoogleIcon /> Masuk dengan akun kampus
              </Button>
            </form>
          ) : (
            <>
              <Button variant="secondary" block disabled={busy} onClick={google}>
                <GoogleIcon /> {busy ? "Mengalihkan ke Google…" : "Masuk dengan Google kampus"}
              </Button>
              <p className="text-center text-xs text-muted">Khusus akun Google kampus (email .ac.id).</p>
            </>
          )}

          {judge && (
            <Button variant="ghost" block onClick={judgeLogin} disabled={busy}>
              Masuk sebagai juri (akun demo)
            </Button>
          )}
          <DemoNotice />
        </div>
      </div>
    </PlainShell>
  );
}
