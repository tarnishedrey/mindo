"use client";

import { ArrowLeft, CalendarPlus, MapPin, Send, Video, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PlainShell } from "@/components/AppShell";
import { RequireProfile } from "@/components/AuthProvider";
import { Avatar, Button, EmptyState, ErrorNote, Field, Input, Spinner, Tag, cx } from "@/components/ui";
import { getRepo, RepoError } from "@/lib/data";
import { useConns, useProfiles } from "@/lib/hooks";
import type { Message, Profile, StudySession } from "@/lib/types";

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

function SessionCard({ s, mine }: { s: StudySession; mine: boolean }) {
  return (
    <div className={cx("w-64 rounded-2xl border p-3", mine ? "border-brand/30 bg-brand-soft" : "border-line bg-surface")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-strong">Ajakan sesi belajar</p>
      <p className="mt-1 font-semibold text-ink">{s.topic}</p>
      <p className="mt-2 text-sm text-ink">
        {fmtDate(s.date)}, {s.time}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
        {s.mode === "online" ? <Video size={14} /> : <MapPin size={14} />}
        {s.mode === "online" ? "Online" : "Tatap muka"}
        {s.place && ` · ${s.place}`}
      </p>
    </div>
  );
}

function SessionSheet({ onClose, onSend }: { onClose: () => void; onSend: (s: StudySession) => Promise<void> }) {
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const [s, setS] = useState<StudySession>({ topic: "", date: tomorrow, time: "19:00", mode: "offline", place: "" });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof StudySession>(k: K, v: StudySession[K]) => setS((x) => ({ ...x, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSend({ ...s, topic: s.topic.trim(), place: s.place.trim() });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-ink/40" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe animate-rise mx-auto w-full max-w-md rounded-t-3xl bg-surface px-5 pt-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Ajak sesi belajar</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-muted hover:bg-canvas">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="Materi">
            <Input required value={s.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Contoh: Latihan soal limit Kalkulus" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <Input type="date" required min={new Date().toISOString().slice(0, 10)} value={s.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Jam">
              <Input type="time" required value={s.time} onChange={(e) => set("time", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mode">
            {(["offline", "online"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={s.mode === m}
                onClick={() => set("mode", m)}
                className={cx(
                  "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium",
                  s.mode === m ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-muted",
                )}
              >
                {m === "online" ? <Video size={16} /> : <MapPin size={16} />}
                {m === "online" ? "Online" : "Tatap muka"}
              </button>
            ))}
          </div>
          <Field label={s.mode === "online" ? "Link meeting (opsional)" : "Tempat"}>
            <Input
              required={s.mode === "offline"}
              value={s.place}
              onChange={(e) => set("place", e.target.value)}
              placeholder={s.mode === "online" ? "meet.google.com/…" : "Perpustakaan pusat lt. 2"}
            />
          </Field>
        </div>
        <Button type="submit" block className="mb-4 mt-6" disabled={busy}>
          Kirim ajakan
        </Button>
      </form>
    </div>
  );
}

function Chat({ me }: { me: Profile }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { connections, loaded } = useConns(me.id);
  const conn = connections.find((c) => c.id === id);
  const otherId = conn ? (conn.requesterId === me.id ? conn.addresseeId : conn.requesterId) : "";
  const other = useProfiles(otherId ? [otherId] : [])[otherId];

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conn || conn.status !== "accepted") return;
    const repo = getRepo();
    repo.listMsgs(conn.id).then(setMessages).catch(() => setError("Pesan gagal dimuat."));
    return repo.onMsg(conn.id, (m) =>
      setMessages((xs) => (xs && !xs.some((x) => x.id === m.id) ? [...xs, m] : xs)),
    );
  }, [conn?.id, conn?.status]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function send(body: string, session?: StudySession) {
    if (!conn) return;
    setError("");
    try {
      const m = await getRepo().sendMsg(conn.id, body, session);
      setMessages((xs) => (xs && !xs.some((x) => x.id === m.id) ? [...xs, m] : xs));
    } catch (e) {
      setError(e instanceof RepoError ? e.message : "Pesan gagal dikirim.");
      throw e;
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    send(body).catch(() => setText(body));
  }

  if (!loaded) return <Spinner />;
  if (!conn || conn.status !== "accepted")
    return (
      <PlainShell>
        <EmptyState title="Chat belum tersedia" body="Chat terbuka setelah ajakan belajar diterima." />
      </PlainShell>
    );

  return (
    <PlainShell>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur">
        <button onClick={() => router.push("/connections")} className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface" aria-label="Kembali">
          <ArrowLeft size={22} />
        </button>
        <Link href={`/profile/${otherId}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={other?.fullName ?? "?"} size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{other?.fullName ?? "…"}</p>
              {other?.isSample && <Tag>Contoh</Tag>}
            </div>
            <p className="truncate text-xs text-muted">{other?.university}</p>
          </div>
        </Link>
      </header>

      <div className="flex-1 space-y-2 px-4 pb-28 pt-4">
        {!messages && <Spinner />}
        {messages?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">Kalian sudah terhubung. Sapa dulu, lalu atur sesi belajar pertama!</p>
        )}
        {messages?.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <div key={m.id} className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
              {m.kind === "session" && m.session ? (
                <SessionCard s={m.session} mine={mine} />
              ) : (
                <p
                  className={cx(
                    "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px]",
                    mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-surface text-ink",
                  )}
                >
                  {m.body}
                </p>
              )}
              <span className="mt-0.5 px-1 text-[11px] text-faint">{fmtTime(m.createdAt)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 px-3 pt-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {error && (
            <div className="mb-2">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
          <form onSubmit={submit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-label="Ajak sesi belajar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink hover:bg-accent hover:text-ink"
            >
              <CalendarPlus size={20} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pesan…"
              maxLength={2000}
              className="h-11 min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 text-[15px] outline-none focus:border-brand"
            />
            <button type="submit" disabled={!text.trim()} aria-label="Kirim" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:bg-brand/40">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {sheet && (
        <SessionSheet
          onClose={() => setSheet(false)}
          onSend={(s) => send(`Ajakan sesi belajar: ${s.topic}`, s)}
        />
      )}
    </PlainShell>
  );
}

export default function ChatPage() {
  return <RequireProfile>{(me) => <Chat me={me} />}</RequireProfile>;
}
