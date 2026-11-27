import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser, Connection, Message, Profile, StudySession } from "../types";
import { RepoError, type ProfileInput, type Repo } from "./repo";

type ProfileRow = {
  id: string;
  full_name: string;
  university: string;
  city: string;
  faculty: string;
  study_program: string;
  year: number;
  bio: string;
  courses: string[];
  availability: string[];
  quiz_answers: number[] | null;
  is_sample: boolean;
  created_at: string;
};
type ConnectionRow = { id: string; requester_id: string; addressee_id: string; status: Connection["status"]; created_at: string };
type MessageRow = {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  kind: Message["kind"];
  session: StudySession | null;
  created_at: string;
};

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  fullName: r.full_name,
  university: r.university,
  city: r.city,
  faculty: r.faculty,
  studyProgram: r.study_program,
  year: r.year,
  bio: r.bio,
  courses: r.courses ?? [],
  availability: r.availability ?? [],
  quizAnswers: r.quiz_answers,
  isSample: r.is_sample,
  createdAt: r.created_at,
});
const toConnection = (r: ConnectionRow): Connection => ({
  id: r.id,
  requesterId: r.requester_id,
  addresseeId: r.addressee_id,
  status: r.status,
  createdAt: r.created_at,
});
const toMessage = (r: MessageRow): Message => ({
  id: r.id,
  connectionId: r.connection_id,
  senderId: r.sender_id,
  body: r.body,
  kind: r.kind,
  session: r.session,
  createdAt: r.created_at,
});

function fail(error: { message: string } | null, friendly: string): asserts error is null {
  if (error) throw new RepoError(`${friendly} (${error.message})`);
}

export class SupabaseRepo implements Repo {
  readonly mode = "supabase" as const;
  private sb: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey);
  }

  private async uid(): Promise<string> {
    const { data } = await this.sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new RepoError("Kamu perlu masuk dulu.");
    return id;
  }

  async getUser(): Promise<AuthUser | null> {
    const { data } = await this.sb.auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? "" } : null;
  }

  onAuthChange(cb: (user: AuthUser | null) => void) {
    const { data } = this.sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      cb(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => data.subscription.unsubscribe();
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/onboarding` : undefined },
    });
    fail(error, "Pendaftaran gagal");
    return { needsConfirm: !data.session };
  }

  async signIn(email: string, password: string) {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) throw new RepoError("Email atau kata sandi salah, atau email belum dikonfirmasi.");
  }

  async signOut() {
    await this.sb.auth.signOut();
  }

  async getMe() {
    const user = await this.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  }

  async saveMe(input: ProfileInput) {
    const id = await this.uid();
    const row = {
      id,
      full_name: input.fullName,
      university: input.university,
      city: input.city,
      faculty: input.faculty,
      study_program: input.studyProgram,
      year: input.year,
      bio: input.bio,
      courses: input.courses,
      availability: input.availability,
      quiz_answers: input.quizAnswers,
    };
    const { data, error } = await this.sb.from("profiles").upsert(row).select().single();
    fail(error, "Profil gagal disimpan");
    return toProfile(data as ProfileRow);
  }

  async getProfile(id: string) {
    const { data, error } = await this.sb.from("profiles").select("*").eq("id", id).maybeSingle();
    fail(error, "Profil gagal dimuat");
    return data ? toProfile(data as ProfileRow) : null;
  }

  async listProfiles() {
    const { data, error } = await this.sb.from("profiles").select("*").not("quiz_answers", "is", null).limit(500);
    fail(error, "Daftar mahasiswa gagal dimuat");
    return (data as ProfileRow[]).map(toProfile);
  }

  async listConns() {
    const { data, error } = await this.sb.from("connections").select("*").order("created_at", { ascending: false });
    fail(error, "Koneksi gagal dimuat");
    return (data as ConnectionRow[]).map(toConnection);
  }

  async connect(toId: string) {
    const me = await this.uid();
    const { data, error } = await this.sb
      .from("connections")
      .insert({ requester_id: me, addressee_id: toId })
      .select()
      .single();
    if (error?.code === "23505") throw new RepoError("Kalian sudah pernah terhubung atau ada permintaan yang menunggu.");
    fail(error, "Permintaan gagal dikirim");
    return toConnection(data as ConnectionRow);
  }

  async respond(connectionId: string, accept: boolean) {
    const { error } = await this.sb
      .from("connections")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", connectionId);
    fail(error, "Gagal menjawab permintaan");
  }

  onConnsChange(cb: () => void) {
    const channel = this.sb
      .channel(`connections-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => cb())
      .subscribe();
    return () => {
      void this.sb.removeChannel(channel);
    };
  }

  async listMsgs(connectionId: string) {
    const { data, error } = await this.sb
      .from("messages")
      .select("*")
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: true })
      .limit(500);
    fail(error, "Pesan gagal dimuat");
    return (data as MessageRow[]).map(toMessage);
  }

  async sendMsg(connectionId: string, body: string, session?: StudySession) {
    const me = await this.uid();
    const { data, error } = await this.sb
      .from("messages")
      .insert({ connection_id: connectionId, sender_id: me, body, kind: session ? "session" : "text", session: session ?? null })
      .select()
      .single();
    fail(error, "Pesan gagal dikirim");
    return toMessage(data as MessageRow);
  }

  onMsg(connectionId: string, cb: (m: Message) => void) {
    const channel = this.sb
      .channel(`messages-${connectionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${connectionId}` },
        (payload) => cb(toMessage(payload.new as MessageRow)),
      )
      .subscribe();
    return () => {
      void this.sb.removeChannel(channel);
    };
  }
}
