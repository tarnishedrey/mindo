import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindo: Mind and Do",
  description: "Temukan teman belajar yang cara belajarnya cocok denganmu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f6fa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
