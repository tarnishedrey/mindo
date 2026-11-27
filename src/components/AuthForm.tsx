"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { demoAccount, getRepo, RepoError } from "@/lib/data";
import { PlainShell } from "./AppShell";
import { DemoNotice } from "./DemoNotice";
import { Logo } from "./Logo";
import { Button, ErrorNote, Field, Input } from "./ui";

const demoUser = { email: "juri@demo.mindo.test", password: "mindo-demo" };

export const isCampusEmail = (email: string) => /\.ac\.id$/i.test(email.trim()) || /@demo\.mindo\.test$/i.test(email.trim());

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/discover";
  const repo = getRepo();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  const demo = repo.mode === "demo" ? demoUser : demoAccount.email ? demoAccount : null;

  async function run(fn: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof RepoError ? e.message : "Terjadi kesalahan. Coba lagi sebentar.");
    } finally {
      setBusy(false);
    }
  }

  async function goNext() {
    const p = await repo.getMe();
    router.replace(p?.quizAnswers ? next : "/onboarding");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      if (mode === "signup") {
        if (!isCampusEmail(email)) throw new RepoError("Gunakan email kampus yang berakhiran .ac.id.");
        if (password.length < 8) throw new RepoError("Kata sandi minimal 8 karakter.");
        const { needsConfirm } = await repo.signUp(email, password);
        if (needsConfirm) return setCheckInbox(true);
      } else {
        await repo.signIn(email, password);
      }
      await goNext();
    });
  }

  function tryDemo() {
    if (!demo) return;
    void run(async () => {
      try {
        await repo.signIn(demo.email, demo.password);
      } catch (e) {
        if (repo.mode !== "demo") throw e;
        await repo.signUp(demo.email, demo.password);
      }
      await goNext();
    });
  }

  if (checkInbox) {
    return (
      <PlainShell>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <MailCheck size={32} />
          </div>
          <h1 className="mt-5 text-xl font-bold">Cek email kampusmu</h1>
          <p className="mt-2 text-sm text-muted">
            Kami mengirim tautan konfirmasi ke <strong className="text-ink">{email}</strong>. Buka tautannya, lalu
            lanjutkan mengisi profil.
          </p>
        </div>
      </PlainShell>
    );
  }

  const signup = mode === "signup";
  return (
    <PlainShell>
      <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
        <Link href="/" className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="Kembali">
          <ArrowLeft size={22} />
        </Link>
        <div className="mt-4">
          <Logo />
          <h1 className="mt-6 text-2xl font-bold">{signup ? "Buat akun" : "Masuk"}</h1>
          <p className="mt-1 text-sm text-muted">
            {signup ? "Khusus mahasiswa: daftar dengan email kampus (.ac.id)." : "Selamat datang kembali."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email kampus" hint={signup && repo.mode === "demo" ? "Mode demo: email tidak diverifikasi, misalnya nama@student.ub.ac.id." : undefined}>
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@student.kampus.ac.id" />
          </Field>
          <Field label="Kata sandi" hint={signup ? "Minimal 8 karakter." : undefined}>
            <Input
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={signup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" block disabled={busy}>
            {busy ? "Tunggu sebentar…" : signup ? "Daftar" : "Masuk"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {signup ? "Sudah punya akun? " : "Belum punya akun? "}
          <Link href={signup ? "/login" : "/signup"} className="font-semibold text-brand">
            {signup ? "Masuk" : "Daftar"}
          </Link>
        </p>

        {demo && (
          <div className="mt-auto space-y-3 pt-10">
            <DemoNotice />
            <Button variant="ghost" block onClick={tryDemo} disabled={busy}>
              Coba pakai akun demo juri
            </Button>
          </div>
        )}
      </div>
    </PlainShell>
  );
}
