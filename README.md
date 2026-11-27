# Mindo: Mind and Do

Web app mobile untuk menemukan teman belajar yang cara belajarnya cocok. Dibuat oleh Team TORIDIWAN untuk STACK 2026 (GDGoC ITB), Case 1: Smarter Campus and Learning.

**Alur inti**

1. Masuk dengan akun Google kampus (email `.ac.id`). Akun Google pribadi otomatis ditolak.
2. Isi profil (kampus, kota, prodi, mata kuliah), lalu pilih waktu luang.
3. Isi kuis 8 pertanyaan untuk mendapatkan *study personality*.
4. Lihat rekomendasi teman belajar yang diurutkan berdasarkan skor kecocokan. Jangkauan bisa dipilih: Kampusku, Kotaku, atau Semua kampus.
5. Kirim ajakan belajar. Setelah diterima, kalian bisa chat dan mengirim ajakan sesi belajar (materi, tanggal, jam, tatap muka atau online).

## Menjalankan di laptop

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Tanpa pengaturan apa pun, aplikasi berjalan dalam **mode demo**:

- Semua data disimpan di browser.
- Sudah ada 14 mahasiswa contoh yang fiktif dan diberi label *Contoh*.
- Mahasiswa contoh otomatis menerima ajakan dan membalas chat.

## Struktur kode

| Bagian | Isi |
|---|---|
| `src/lib/quiz.ts` | Pertanyaan kuis, 4 dimensi kebiasaan, dan nama study personality |
| `src/lib/matching.ts` | Algoritma skor kecocokan (lihat di bawah) |
| `src/lib/matching.test.ts` | Unit test algoritma (`npm test`) |
| `src/lib/data/` | Akses data: `supabaseRepo.ts` (backend asli) dan `demoRepo.ts` (mode demo) |
| `src/lib/sampleProfiles.json` | Data mahasiswa contoh (fiktif) |
| `src/app/` | Halaman: `onboarding`, `discover`, `profile/[id]`, `connections`, `chat/[id]`, `me` |
| `supabase/schema.sql` | Tabel, aturan keamanan (RLS), dan trigger untuk mahasiswa contoh |
| `scripts/seed.mjs` | Mengisi mahasiswa contoh dan akun demo juri ke Supabase |

## Algoritma matching

Skor kecocokan (0–100) dihitung dari tiga bagian:

| Bagian | Bobot | Cara hitung |
|---|---|---|
| Kebiasaan belajar | 60% | Tiap dimensi bernilai −1 sampai 1. Hasilnya `1 − rata-rata selisih / 2`. |
| Waktu luang | 30% | Jumlah waktu luang yang sama. 3 atau lebih dihitung penuh. |
| Mata kuliah | 10% | Jumlah mata kuliah yang sama. 2 atau lebih dihitung penuh. |

Empat dimensinya: suasana (tenang ↔ diskusi), cara kerja (mandiri dulu ↔ bareng dari awal), waktu (pagi–siang ↔ malam), dan mode (online ↔ tatap muka). Bobot bisa diubah di `weights` dalam `matching.ts`. Matching tidak memakai AI.

## Memasang backend Supabase

1. Buat project gratis di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, lalu klik **Run**.
3. Buka **Authentication → URL Configuration**. Isi **Site URL** dengan alamat web kalian (misalnya `https://mindo.vercel.app`).
4. Buat file `.env.local` (jangan di-commit):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_DEMO_EMAIL=juri@demo.mindo.test
   NEXT_PUBLIC_DEMO_PASSWORD=pilih-sandi-demo
   ```

   URL dan anon key ada di **Project Settings → API**.
5. Isi mahasiswa contoh dan akun demo juri. Jalankan sekali dari laptop:

   ```bash
   SUPABASE_URL=https://xxxx.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
   DEMO_PASSWORD=pilih-sandi-demo \
   node scripts/seed.mjs
   ```

   ⚠️ **service_role key melewati semua aturan keamanan.** Pakai hanya di terminal laptopmu. Jangan taruh di `.env.local`, Vercel, GitHub, atau chat.

## Mengaktifkan login Google

1. Buka [Google Cloud Console](https://console.cloud.google.com/), lalu buat project baru (misalnya `mindo`).
2. Buka **APIs & Services → OAuth consent screen**:
   - pilih **External**;
   - isi nama aplikasi `Mindo` dan email kontak;
   - simpan, lalu klik **Publish app**. Kalau masih dalam mode *Testing*, hanya akun yang didaftarkan sebagai test user yang bisa login.
3. Buka **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - **Application type:** Web application.
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Salin **Client ID** dan **Client secret**. Di Supabase, buka **Authentication → Sign In / Providers → Google**, nyalakan, lalu tempel keduanya.
5. Di Supabase, buka **Authentication → URL Configuration**:
   - **Site URL:** isi dengan alamat web kalian.
   - **Redirect URLs:** tambahkan `http://localhost:3000/**` dan `https://<domain-vercel>/**`.

Batasan `.ac.id` dicek di dua tempat: aplikasi langsung mengeluarkan akun non-kampus, dan aturan database (RLS) menolak profil tanpa email `.ac.id`. Sebagian kampus membatasi akun Google mahasiswanya agar tidak bisa login ke aplikasi luar, jadi uji dulu dengan akun kampusmu sendiri.

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [vercel.com](https://vercel.com), pilih **Add New → Project**, lalu import repo-nya.
3. Di **Environment Variables**, isi empat variabel `NEXT_PUBLIC_...` dari langkah sebelumnya.
4. Klik **Deploy**.

Kalau variabel Supabase dikosongkan, hasil deploy berjalan dalam mode demo. Mode ini bisa dipakai sebagai cadangan kalau backend bermasalah.

## Akun demo untuk juri

Di halaman depan ada tombol **"Masuk sebagai juri (akun demo)"**, karena juri tidak punya akun kampus `.ac.id`. Tombol ini masuk ke `juri@demo.mindo.test` memakai sandi dari `NEXT_PUBLIC_DEMO_PASSWORD`. Domain `demo.mindo.test` diizinkan khusus untuk akun ini dan akun mahasiswa contoh.

## Kejujuran data

Semua mahasiswa contoh di aplikasi ini **fiktif** dan selalu ditampilkan dengan label *Contoh*. Jangan menyebut mereka sebagai pengguna nyata di presentasi atau laporan.
