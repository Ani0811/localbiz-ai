"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Camera, 
  Megaphone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  FileText, 
  Check, 
  Copy, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Edit3,
  Download,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { BusinessProfile, ContentType, GenerationResponse } from '@/lib/types';

function GenerateContentWorkspace() {
  const searchParams = useSearchParams();
  const reuseId = searchParams.get('reuse');

  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BusinessProfile | null>(null);
  const [contentType, setContentType] = useState<ContentType>('instagram_caption');
  const [specificOffer, setSpecificOffer] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [overrideTone, setOverrideTone] = useState('');
  const [overrideLanguage, setOverrideLanguage] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Generation result states
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [editableText, setEditableText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentTypesConfig = [
    {
      id: 'instagram_caption',
      label: 'Camera Caption',
      desc: 'Hooks, emojis, verified offer, and targeted local hashtags',
      icon: Camera,
      badge: 'Social'
    },
    {
      id: 'promo_copy',
      label: 'Promotional Copy',
      desc: 'High-converting sales copy with clear call to action',
      icon: Megaphone,
      badge: 'Sales'
    },
    {
      id: 'whatsapp_message',
      label: 'WhatsApp Message',
      desc: 'Direct, friendly announcement with verified contact details',
      icon: MessageSquare,
      badge: 'Direct'
    },
    {
      id: 'google_business_update',
      label: 'Google Business Update',
      desc: 'Local SEO update with hours, location, and action button',
      icon: MapPin,
      badge: 'Local SEO'
    },
    {
      id: 'product_description',
      label: 'Product Catalog',
      desc: 'Sensory, benefit-driven product description with price',
      icon: FileText,
      badge: 'Catalog'
    },
    {
      id: 'weekly_content_plan',
      label: '7-Day Content Plan',
      desc: 'Full weekly calendar with themes, channels, hooks, and CTAs',
      icon: Calendar,
      badge: 'Strategy'
    },
  ];

  useEffect(() => {
    async function init() {
      try {
        const profileList = await api.getProfiles();
        setProfiles(profileList);
        const active = profileList.find((p) => p.is_active) || profileList[0] || null;
        setSelectedProfile(active);

        // If reuse parameter is provided
        if (reuseId) {
          const item = await api.getHistory();
          const target = item.find((h) => h.id === reuseId);
          if (target) {
            setContentType(target.content_type);
            setSpecificOffer(target.topic_or_offer || '');
            setOverrideTone(target.tone || '');
            setOverrideLanguage(target.language || '');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize workspace');
      }
    }
    init();
  }, [reuseId]);

  const handleGenerate = async () => {
    if (!selectedProfile) {
      setError('Please create or select an active business profile first.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.generateContent({
        profile_id: selectedProfile.id,
        content_type: contentType,
        specific_offer_or_product: specificOffer || undefined,
        custom_topic: customTopic || undefined,
        override_tone: overrideTone || undefined,
        override_language: overrideLanguage || undefined,
        additional_instructions: additionalNotes || undefined,
      });

      setResult(response);
      setEditableText(response.generated_content);
      setIsSaved(true);
    } catch (err: any) {
      setError(err.message || 'Generation failed. Ensure LM Studio is active.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!result) return;
    try {
      const updated = await api.updateHistoryItem(result.id, editableText);
      setResult(updated);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save edits');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([editableText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contentType}-${selectedProfile?.name || 'marketing'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            AI Marketing Generation Workspace
          </h1>
          <p className="text-sm text-slate-400">
            Powered by local LM Studio. Grounded strictly in your business profile.
          </p>
        </div>

        {/* Profile Selector */}
        {profiles.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Business:</span>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const found = profiles.find((p) => p.id === e.target.value);
                if (found) setSelectedProfile(found);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedProfile && (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>You need a business profile before generating marketing copy.</span>
          </div>
          <Link
            href="/profile"
            className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Create Profile
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Need help? Check your LM Studio status on the{' '}
            <Link href="/settings" className="underline text-emerald-400 font-medium">
              AI Status & Diagnostic page
            </Link>.
          </p>
        </div>
      )}

      {/* Grid: Config & Live Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generation Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Content Type Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <label className="text-xs font-bold text-white block uppercase tracking-wider">
              1. Choose Asset Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {contentTypesConfig.map((item) => {
                const Icon = item.icon;
                const isSelected = contentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setContentType(item.id as ContentType)}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-xs font-semibold leading-snug">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context & Targeting */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <label className="text-xs font-bold text-white block uppercase tracking-wider">
              2. Tailor Context & Offers
            </label>

            {/* Offer / Product to feature */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Feature Product or Offer (From Catalog)
              </label>
              {selectedProfile?.products_services && selectedProfile.products_services.length > 0 ? (
                <select
                  value={specificOffer}
                  onChange={(e) => setSpecificOffer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- General / Entire Business --</option>
                  {selectedProfile.products_services.map((p, i) => (
                    <option key={i} value={p.name}>
                      {p.name} {p.price ? `(${p.price})` : ''} {p.offer ? `[${p.offer}]` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Sourdough Loaf (₹180)"
                  value={specificOffer}
                  onChange={(e) => setSpecificOffer(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>

            {/* Custom Theme or Event */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Occasion, Event or Theme (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Weekend Flash Sale, Rainy Day Special, Durga Puja/Eid Discount"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Language & Tone overrides */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Language</label>
                <select
                  value={overrideLanguage}
                  onChange={(e) => setOverrideLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Default ({selectedProfile?.language || 'English'})</option>
                  <option value="English">English</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="Bengali-English">Bengali-English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tone</label>
                <select
                  value={overrideTone}
                  onChange={(e) => setOverrideTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Default ({selectedProfile?.tone || 'Professional'})</option>
                  <option value="Warm, Friendly and Casual">Friendly & Casual</option>
                  <option value="Energetic and Promotional">Energetic & Promo</option>
                  <option value="Authentic and Nostalgic">Artisanal & Nostalgic</option>
                  <option value="Professional and Elegant">Professional & Elegant</option>
                </select>
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Instructions or Constraints
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Include a call to action to order via WhatsApp, mention street parking available..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !selectedProfile}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating with LM Studio...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Marketing Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Output & Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full min-h-[560px]">
            {/* Header of Preview Box */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Generated Marketing Copy</h3>
                {result && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {result.model_used}
                  </span>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Download as Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveEdits}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
                  >
                    <span>{isSaved ? 'Saved!' : 'Save Edits'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Factual Accuracy Badge */}
            {result && (
              <div className="my-3">
                {result.factual_warnings && result.factual_warnings.length > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Factual Warning: Model Output Requires Verification</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-amber-200/90 pl-1">
                      {result.factual_warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Factually Grounded: Matches your saved business profile and catalog.</span>
                  </div>
                )}
              </div>
            )}

            {/* Textarea Workspace */}
            <div className="flex-1 flex flex-col pt-2">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-20">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-300">
                    LM Studio is generating marketing copy...
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs text-center">
                    Grounded in {selectedProfile?.name}&apos;s profile. Local inference running on your CPU/GPU.
                  </p>
                </div>
              ) : editableText ? (
                <div className="flex-1 flex flex-col space-y-2">
                  <textarea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="flex-1 w-full min-h-[380px] p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-emerald-500 resize-y"
                    placeholder="Generated marketing content will appear here..."
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>
                      {editableText.split(/\s+/).filter(Boolean).length} words | {editableText.length} characters
                    </span>
                    <span>Editable before copying or saving</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Ready to create content</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Select your target asset type on the left, pick an offer or custom theme, and click Generate.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-xs">Loading generation workspace...</div>}>
      <GenerateContentWorkspace />
    </Suspense>
  );
}
