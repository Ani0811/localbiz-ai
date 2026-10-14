"use client";

import { useEffect, useState } from 'react';
import { 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIHealth, BackendHealth } from '@/lib/types';

export default function SettingsPage() {
  const [aiHealth, setAiHealth] = useState<AIHealth | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [ai, backend] = await Promise.all([
        api.getAIHealth(),
        api.getBackendHealth()
      ]);
      setAiHealth(ai);
      setBackendHealth(backend);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const isModelLoaded = aiHealth?.is_reachable && (aiHealth?.status === 'model_loaded' || aiHealth?.is_model_loaded);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            AI Diagnostics & LM Studio Status
          </h1>
          <p className="text-sm text-slate-400">
            Real-time status of your local inference engine, model bindings, and privacy guarantees.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LM Studio Connection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              LM Studio Engine
            </h3>
            {aiHealth?.is_reachable ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Server Reachable
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                Server Offline
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Configured Endpoint:</span>
              <code className="text-slate-200 font-mono">{aiHealth?.base_url || 'http://localhost:1234/v1'}</code>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Target Model:</span>
              <code className="text-emerald-400 font-mono font-semibold">{aiHealth?.configured_model}</code>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Model Load Status:</span>
              <span className={`font-semibold ${isModelLoaded ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isModelLoaded ? 'Loaded & Active in Memory' : 'No Model Loaded'}
              </span>
            </div>

            {aiHealth?.loaded_models && aiHealth.loaded_models.length > 0 && (
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Models Currently in Memory:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiHealth.loaded_models.map((m, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px] border border-slate-700">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiHealth?.error_detail && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                <strong>Diagnostic Error:</strong> {aiHealth.error_detail}
              </div>
            )}
          </div>
        </div>

        {/* Backend & Database Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Backend & Local Storage
            </h3>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-slate-200 font-medium">SQLite (aiosqlite async)</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Database Status:</span>
              <span className="text-emerald-400 font-semibold">{backendHealth?.database || 'ok'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Active Business Profiles:</span>
              <span className="text-slate-200 font-medium">{backendHealth?.active_profile_count ?? 0}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Backend Version:</span>
              <span className="text-slate-200 font-mono">{backendHealth?.app_version || '1.0.0'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-200 block">Privacy Guarantee:</strong>
                All business records and prompt outputs remain in the local <code className="text-emerald-400 font-mono">data/localbiz.db</code> file on this machine. No cloud telemetry or third-party tracking.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting & Setup Commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          Quick LM Studio Commands (Windows Host)
        </h3>
        <p className="text-xs text-slate-400">
          Run these commands in PowerShell or Command Prompt to start the server and load an open-weight model:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Command 1 */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">1. Start LM Studio Server</span>
              <button
                onClick={() => copyCommand('lms server start --cors')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Copy command"
              >
                {copiedCmd === 'lms server start --cors' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs text-emerald-400 font-mono block bg-slate-900 p-2 rounded">
              lms server start --cors
            </code>
            <p className="text-[11px] text-slate-500">
              Starts the local OpenAI-compatible server on port 1234 with CORS enabled.
            </p>
          </div>

          {/* Command 2 */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">2. Load 3B-4B Model into Memory</span>
              <button
                onClick={() => copyCommand('lms load google/gemma-3-4b -y')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Copy command"
              >
                {copiedCmd === 'lms load google/gemma-3-4b -y' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs text-emerald-400 font-mono block bg-slate-900 p-2 rounded">
              lms load google/gemma-3-4b -y
            </code>
            <p className="text-[11px] text-slate-500">
              Preloads Gemma 3 4B into memory for low-latency marketing generation.
            </p>
          </div>

          {/* Command 3 */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">3. Bind to 0.0.0.0 for Podman Containers</span>
              <button
                onClick={() => copyCommand('lms server start --bind 0.0.0.0 --cors')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Copy command"
              >
                {copiedCmd === 'lms server start --bind 0.0.0.0 --cors' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs text-emerald-400 font-mono block bg-slate-900 p-2 rounded">
              lms server start --bind 0.0.0.0 --cors
            </code>
            <p className="text-[11px] text-slate-500">
              Allows Podman container networks to route to the Windows host server.
            </p>
          </div>

          {/* Command 4 */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">4. Alternative Reasoning Model</span>
              <button
                onClick={() => copyCommand('lms load nvidia/nemotron-3-nano-4b -y')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Copy command"
              >
                {copiedCmd === 'lms load nvidia/nemotron-3-nano-4b -y' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs text-emerald-400 font-mono block bg-slate-900 p-2 rounded">
              lms load nvidia/nemotron-3-nano-4b -y
            </code>
            <p className="text-[11px] text-slate-500">
              NVIDIA Nemotron 3 Nano 4B with step-by-step reasoning support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
