"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  History, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Edit3, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar,
  Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { GenerationResponse, BusinessProfile } from '@/lib/types';

export default function HistoryPage() {
  const [history, setHistory] = useState<GenerationResponse[]>([]);
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [histData, profData] = await Promise.all([
        api.getHistory(),
        api.getProfiles()
      ]);
      setHistory(histData);
      setProfiles(profData);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generated item?')) return;
    try {
      await api.deleteHistoryItem(id);
      setHistory(history.filter((h) => h.id !== id));
    } catch (err) {
      alert("Failed to delete history item");
    }
  };

  const startEdit = (item: GenerationResponse) => {
    setEditingId(item.id);
    setEditText(item.edited_content || item.generated_content);
  };

  const saveEdit = async (id: string) => {
    try {
      const updated = await api.updateHistoryItem(id, editText);
      setHistory(history.map((h) => (h.id === id ? updated : h)));
      setEditingId(null);
    } catch (err) {
      alert("Failed to save edited content");
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesType = filterType === 'all' || item.content_type === filterType;
    const matchesProfile = filterProfile === 'all' || item.profile_id === filterProfile;
    const textToSearch = (item.topic_or_offer + " " + item.edited_content + " " + item.generated_content).toLowerCase();
    const matchesSearch = textToSearch.includes(searchQuery.toLowerCase());
    return matchesType && matchesProfile && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            Content History & Saved Copies
          </h1>
          <p className="text-sm text-slate-400">
            All marketing copy generated on your local machine is stored in SQLite. Edit, copy, or reuse anytime.
          </p>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
        >
          <Sparkles className="w-4 h-4" />
          New Generation
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search keywords, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Content Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Asset Types</option>
              <option value="instagram_caption">Instagram Captions</option>
              <option value="promo_copy">Promotional Copy</option>
              <option value="whatsapp_message">WhatsApp Messages</option>
              <option value="google_business_update">Google Business Updates</option>
              <option value="product_description">Product Descriptions</option>
              <option value="weekly_content_plan">7-Day Plans</option>
            </select>
          </div>

          {/* Profile Filter */}
          {profiles.length > 1 && (
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All Businesses</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Loading generation history...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
          <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-slate-300">No matching generation history found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || filterType !== 'all' ? 'Try adjusting your search filters' : 'Generate your first piece of copy to see it saved here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 transition-colors hover:border-slate-700/80"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.content_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.topic_or_offer}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.model_used}
                  </span>
                </div>
              </div>

              {/* Factual Warnings check */}
              {item.factual_warnings && item.factual_warnings.length > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Flagged unverified detail: {item.factual_warnings[0]}</span>
                </div>
              )}

              {/* Content Body / Inline Editor */}
              {editingId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={6}
                    className="w-full p-3 rounded-lg bg-slate-950 border border-emerald-500 text-slate-100 font-mono text-xs focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <pre className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                    {item.edited_content || item.generated_content}
                  </pre>
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Tone: <strong className="text-slate-300">{item.tone}</strong></span>
                  <span>Lang: <strong className="text-slate-300">{item.language}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(item.id, item.edited_content || item.generated_content)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => startEdit(item)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  <Link
                    href={`/generate?reuse=${item.id}`}
                    className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
                  >
                    Reuse Settings
                  </Link>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
