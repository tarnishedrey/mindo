import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_PASSWORD;
if (!url || !serviceKey || !demoPassword) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD first.");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
const samples = JSON.parse(await readFile(new URL("../src/lib/sampleProfiles.json", import.meta.url), "utf8"));

async function ensureUser(email, password) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (!error) return data.user.id;
  const { data: list, error: listError } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const found = list.users.find((u) => u.email === email);
  if (!found) throw error;
  return found.id;
}

for (const s of samples) {
  const id = await ensureUser(`${s.key}@demo.mindo.test`, randomBytes(18).toString("base64url"));
  const { error } = await sb.from("profiles").upsert({
    id,
    full_name: s.fullName,
    university: s.university,
    city: s.city,
    faculty: s.faculty,
    study_program: s.studyProgram,
    year: s.year,
    bio: s.bio,
    courses: s.courses,
    availability: s.availability,
    quiz_answers: s.quizAnswers,
    is_sample: true,
  });
  if (error) throw error;
  console.log(`sample: ${s.fullName}`);
}

const demoEmail = "juri@demo.mindo.test";
await ensureUser(demoEmail, demoPassword);
console.log(`\nJudge account ready: ${demoEmail} (password from DEMO_PASSWORD).`);
console.log("It has no profile yet, so the first person to log in goes through onboarding.");
