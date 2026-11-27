import { rank } from "../matching";
import samples from "../sampleProfiles.json";
import type { AuthUser, Connection, Message, Profile, StudySession } from "../types";
import { RepoError, type ProfileInput, type Repo } from "./repo";

type DemoUser = { id: string; email: string; password: string };
type Store = {
  version: 1;
  users: DemoUser[];
  sessionUserId: string | null;
  profiles: Profile[];
  connections: Connection[];
  messages: Message[];
};

const storeKey = "mindo-demo-v1";
const replyDelay = 1200;

const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function freshStore(): Store {
  const created = new Date(Date.now() - 7 * 864e5).toISOString();
  return {
    version: 1,
    users: [],
    sessionUserId: null,
    profiles: samples.map((s) => ({
      id: s.key,
      fullName: s.fullName,
      university: s.university,
      city: s.city,
      faculty: s.faculty,
      studyProgram: s.studyProgram,
      year: s.year,
      bio: s.bio,
      courses: s.courses,
      availability: s.availability,
      quizAnswers: s.quizAnswers,
      isSample: true,
      createdAt: created,
    })),
    connections: [],
    messages: [],
  };
}

const replies = [
  "Boleh banget! Kamu biasanya paling enak belajar jam berapa?",
  "Siap, aku juga lagi butuh teman buat bahas materi ini 😄",
  "Oke, nanti aku bawa rangkuman bab kemarin ya.",
  "Sip, kabari aja kalau mau mulai.",
];

export class DemoRepo implements Repo {
  readonly mode = "demo" as const;
  private authListeners = new Set<(u: AuthUser | null) => void>();
  private connListeners = new Set<() => void>();
  private msgListeners = new Map<string, Set<(m: Message) => void>>();

  private load(): Store {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Store;
        if (parsed.version === 1) return parsed;
      }
    } catch {
    }
    return freshStore();
  }

  private save(s: Store) {
    try {
      localStorage.setItem(storeKey, JSON.stringify(s));
    } catch {
    }
  }

  private me(s: Store): string {
    if (!s.sessionUserId) throw new RepoError("Kamu perlu masuk dulu.");
    return s.sessionUserId;
  }

  private emitAuth(u: AuthUser | null) {
    this.authListeners.forEach((cb) => cb(u));
  }
  private emitConns() {
    this.connListeners.forEach((cb) => cb());
  }
  private emitMsg(m: Message) {
    this.msgListeners.get(m.connectionId)?.forEach((cb) => cb(m));
  }

  async getUser() {
    const s = this.load();
    const u = s.users.find((x) => x.id === s.sessionUserId);
    return u ? { id: u.id, email: u.email } : null;
  }

  onAuthChange(cb: (u: AuthUser | null) => void) {
    this.authListeners.add(cb);
    return () => {
      this.authListeners.delete(cb);
    };
  }

  async signUp(email: string, password: string) {
    const s = this.load();
    const e = email.trim().toLowerCase();
    if (s.users.some((u) => u.email === e)) throw new RepoError("Email ini sudah terdaftar. Silakan masuk.");
    const user = { id: uid(), email: e, password };
    s.users.push(user);
    s.sessionUserId = user.id;
    this.save(s);
    this.emitAuth({ id: user.id, email: e });
    return { needsConfirm: false };
  }

  async signIn(email: string, password: string) {
    const s = this.load();
    const e = email.trim().toLowerCase();
    const user = s.users.find((u) => u.email === e && u.password === password);
    if (!user) throw new RepoError("Email atau kata sandi salah.");
    s.sessionUserId = user.id;
    this.save(s);
    this.emitAuth({ id: user.id, email: e });
  }

  async signOut() {
    const s = this.load();
    s.sessionUserId = null;
    this.save(s);
    this.emitAuth(null);
  }

  async getMe() {
    const s = this.load();
    if (!s.sessionUserId) return null;
    return s.profiles.find((p) => p.id === s.sessionUserId) ?? null;
  }

  async saveMe(input: ProfileInput) {
    const s = this.load();
    const id = this.me(s);
    const existing = s.profiles.find((p) => p.id === id);
    const profile: Profile = { ...input, id, isSample: false, createdAt: existing?.createdAt ?? now() };
    s.profiles = existing ? s.profiles.map((p) => (p.id === id ? profile : p)) : [...s.profiles, profile];
    const firstQuiz = !existing?.quizAnswers && !!profile.quizAnswers;
    this.save(s);
    if (firstQuiz) this.sendWelcome(id);
    return profile;
  }

  async getProfile(id: string) {
    return this.load().profiles.find((p) => p.id === id) ?? null;
  }

  async listProfiles() {
    return this.load().profiles.filter((p) => p.quizAnswers);
  }

  async listConns() {
    const s = this.load();
    const me = this.me(s);
    return s.connections
      .filter((c) => c.requesterId === me || c.addresseeId === me)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async connect(toId: string) {
    const s = this.load();
    const me = this.me(s);
    if (toId === me) throw new RepoError("Tidak bisa terhubung dengan diri sendiri.");
    const exists = s.connections.some(
      (c) => (c.requesterId === me && c.addresseeId === toId) || (c.requesterId === toId && c.addresseeId === me),
    );
    if (exists) throw new RepoError("Kalian sudah pernah terhubung atau ada permintaan yang menunggu.");
    const conn: Connection = { id: uid(), requesterId: me, addresseeId: toId, status: "pending", createdAt: now() };
    s.connections.push(conn);
    this.save(s);
    this.emitConns();
    if (s.profiles.find((p) => p.id === toId)?.isSample) this.autoAccept(conn.id, toId);
    return conn;
  }

  async respond(connectionId: string, accept: boolean) {
    const s = this.load();
    const me = this.me(s);
    const c = s.connections.find((x) => x.id === connectionId);
    if (!c || c.addresseeId !== me) throw new RepoError("Permintaan tidak ditemukan.");
    c.status = accept ? "accepted" : "declined";
    this.save(s);
    this.emitConns();
  }

  onConnsChange(cb: () => void) {
    this.connListeners.add(cb);
    return () => {
      this.connListeners.delete(cb);
    };
  }

  async listMsgs(connectionId: string) {
    return this.load()
      .messages.filter((m) => m.connectionId === connectionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async sendMsg(connectionId: string, body: string, session?: StudySession) {
    const s = this.load();
    const me = this.me(s);
    const c = s.connections.find((x) => x.id === connectionId);
    if (!c || c.status !== "accepted" || ![c.requesterId, c.addresseeId].includes(me))
      throw new RepoError("Kalian belum terhubung.");
    const msg: Message = {
      id: uid(),
      connectionId,
      senderId: me,
      body,
      kind: session ? "session" : "text",
      session: session ?? null,
      createdAt: now(),
    };
    s.messages.push(msg);
    this.save(s);
    this.emitMsg(msg);
    const other = c.requesterId === me ? c.addresseeId : c.requesterId;
    if (s.profiles.find((p) => p.id === other)?.isSample) this.autoReply(connectionId, other, !!session);
    return msg;
  }

  onMsg(connectionId: string, cb: (m: Message) => void) {
    if (!this.msgListeners.has(connectionId)) this.msgListeners.set(connectionId, new Set());
    this.msgListeners.get(connectionId)!.add(cb);
    return () => {
      this.msgListeners.get(connectionId)?.delete(cb);
    };
  }

  private pushMsg(connectionId: string, senderId: string, body: string) {
    const s = this.load();
    const msg: Message = { id: uid(), connectionId, senderId, body, kind: "text", session: null, createdAt: now() };
    s.messages.push(msg);
    this.save(s);
    this.emitMsg(msg);
  }

  private autoAccept(connectionId: string, sampleId: string) {
    setTimeout(() => {
      const s = this.load();
      const c = s.connections.find((x) => x.id === connectionId);
      if (!c || c.status !== "pending") return;
      c.status = "accepted";
      this.save(s);
      this.emitConns();
      const name = s.profiles.find((p) => p.id === sampleId)?.fullName.split(" ")[0] ?? "Aku";
      this.pushMsg(connectionId, sampleId, `Hai! ${name} di sini. Makasih udah ngajak, ayo belajar bareng!`);
    }, replyDelay);
  }

  private autoReply(connectionId: string, sampleId: string, wasSession: boolean) {
    setTimeout(() => {
      const count = this.load().messages.filter((m) => m.connectionId === connectionId).length;
      const body = wasSession
        ? "Jadwalnya cocok, aku ikut! Sampai ketemu nanti 👍"
        : replies[count % replies.length];
      this.pushMsg(connectionId, sampleId, body);
    }, replyDelay);
  }

  private sendWelcome(userId: string) {
    setTimeout(() => {
      const s = this.load();
      if (s.sessionUserId !== userId) return;
      const me = s.profiles.find((p) => p.id === userId);
      if (!me) return;
      const taken = new Set(s.connections.flatMap((c) => [c.requesterId, c.addresseeId]));
      const candidates = s.profiles.filter((p) => p.isSample && !taken.has(p.id));
      const sample = rank(me, candidates)[0]?.profile;
      if (!sample) return;
      s.connections.push({ id: uid(), requesterId: sample.id, addresseeId: userId, status: "pending", createdAt: now() });
      this.save(s);
      this.emitConns();
    }, 4000);
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(storeKey);
  } catch {
  }
}
