import { DemoRepo } from "./demoRepo";
import type { Repo } from "./repo";
import { SupabaseRepo } from "./supabaseRepo";

let repo: Repo | null = null;

export function getRepo(): Repo {
  if (repo) return repo;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  repo = url && key ? new SupabaseRepo(url, key) : new DemoRepo();
  return repo;
}

export const demoAccount = {
  email: process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "",
  password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "",
};

export { RepoError } from "./repo";
export type { ProfileInput, Repo } from "./repo";
