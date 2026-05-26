import type { Metadata } from "next";
import "./globals.css"; // Твій файл зі стилями Tailwind

export const metadata: Metadata = {
  title: "Smart Menu Planner",
  description: "Розумне планування дієти на Next.js",
};

export default function RootLayout({
  children,
}: Readcoming<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}