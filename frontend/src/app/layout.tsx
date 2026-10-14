import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocalBiz AI — Local-First AI Marketing Assistant",
  description: "Generate factually accurate, high-converting social copy, WhatsApp messages, and marketing campaigns with 100% private local inference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">LocalBiz AI</span>
              <span>— Hacktoberfest 2026 Week 2: Side Hustle</span>
            </div>
            <div className="text-slate-400 flex items-center gap-4">
              <span>🔒 100% Offline & Local</span>
              <span>🚀 Zero Cloud Subscriptions</span>
              <span>📦 Podman Containerized</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
