"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Store, 
  History, 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { api } from '@/lib/api';
import { BusinessProfile, GenerationResponse } from '@/lib/types';

export default function DashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [recentHistory, setRecentHistory] = useState<GenerationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const profiles = await api.getProfiles();
        const active = profiles.find((p) => p.is_active) || profiles[0] || null;
        setProfile(active);

        const history = await api.getHistory();
        setRecentHistory(history.slice(0, 4));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-900/40 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Local-First Small Business Marketing Copilot
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Factually Accurate AI Marketing, Powered by Open Weights on Your Machine.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Turn your business profile, opening hours, verified rates, and current offers into ready-to-post Instagram captions, WhatsApp messages, and weekly marketing plans. Zero cloud APIs, zero subscriptions.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              Generate Marketing Copy
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-sm transition-all"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              Manage Business Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Active Profile & Value Props */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Profile Card */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {profile ? profile.name : "No Profile Configured"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {profile ? profile.category : "Create your first profile to begin"}
                  </p>
                </div>
              </div>
              <Link
                href="/profile"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                {profile ? "Edit Profile" : "+ Create Profile"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {profile ? (
              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <p className="line-clamp-2 text-slate-400">{profile.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{profile.business_hours}</span>
                  </div>
                  {profile.contact_phone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{profile.contact_phone}</span>
                    </div>
                  )}
                  {profile.website_url && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{profile.website_url}</span>
                    </div>
                  )}
                </div>

                {profile.products_services.length > 0 && (
                  <div className="pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Catalog & Offers ({profile.products_services.length} items)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {profile.products_services.slice(0, 4).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-[11px]">
                          <Tag className="w-3 h-3 text-emerald-400" />
                          <span className="font-medium text-slate-200">{p.name}</span>
                          {p.price && <span className="text-emerald-400 font-semibold">{p.price}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 text-center py-6 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm">Please set up your business details so the AI has factual grounding.</p>
                <Link
                  href="/profile"
                  className="mt-4 inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Create Business Profile
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Preferred Tone: <strong className="text-slate-200">{profile?.tone || 'Professional'}</strong></span>
            <span>Language: <strong className="text-slate-200">{profile?.language || 'English'}</strong></span>
          </div>
        </div>

        {/* 3 Pillars Card */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-3">Why LocalBiz AI?</h3>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block font-semibold">100% Factually Grounded</strong>
                  The AI only references your saved profile. It never hallucinates unverified prices or false discounts.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block font-semibold">Total Privacy & Local Inference</strong>
                  All prompts and business secrets stay on your machine. Inferred directly via local LM Studio.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-white block font-semibold">Multilingual Localization</strong>
                  Native support for English, authentic Bengali (বাংলা), and popular conversational Bengali-English (Benglish).
                </div>
              </li>
            </ul>
          </div>
          
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/30 text-[11px] text-emerald-300">
            💡 <strong>Pro Tip:</strong> Load quantized 3B-4B models (e.g., Gemma 3 4B or Nemotron Nano 4B) in LM Studio for rapid inference.
          </div>
        </div>
      </div>

      {/* Recent Generations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Content Generations</h2>
            <p className="text-xs text-slate-400">Quickly preview, edit, or copy recent marketing assets</p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View Full History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No marketing content generated yet.</p>
            <Link
              href="/generate"
              className="mt-3 inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
            >
              Start First Generation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {item.content_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1">
                    {item.topic_or_offer}
                  </h4>
                  <p className="text-xs text-slate-300 whitespace-pre-line line-clamp-3 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                    {item.edited_content || item.generated_content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    Model: {item.model_used}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.id, item.edited_content || item.generated_content)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/generate?reuse=${item.id}`}
                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors"
                    >
                      Reuse
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
