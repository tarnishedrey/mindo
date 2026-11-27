import type { AuthUser, Connection, Message, Profile, StudySession } from "../types";

export type ProfileInput = Omit<Profile, "id" | "createdAt" | "isSample">;

export interface Repo {
  readonly mode: "supabase" | "demo";

  getUser(): Promise<AuthUser | null>;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
  signUp(email: string, password: string): Promise<{ needsConfirm: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;

  getMe(): Promise<Profile | null>;
  saveMe(input: ProfileInput): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(): Promise<Profile[]>;

  listConns(): Promise<Connection[]>;
  connect(toId: string): Promise<Connection>;
  respond(connectionId: string, accept: boolean): Promise<void>;
  onConnsChange(cb: () => void): () => void;

  listMsgs(connectionId: string): Promise<Message[]>;
  sendMsg(connectionId: string, body: string, session?: StudySession): Promise<Message>;
  onMsg(connectionId: string, cb: (m: Message) => void): () => void;
}

export class RepoError extends Error {}
