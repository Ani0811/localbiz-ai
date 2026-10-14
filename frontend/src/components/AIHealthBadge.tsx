"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { AIHealth } from '@/lib/types';

export default function AIHealthBadge() {
  const [health, setHealth] = useState<AIHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getAIHealth();
      setHealth(data);
    } catch {
      setHealth({
        status: 'unreachable',
        base_url: 'http://localhost:1234/v1',
        configured_model: 'google/gemma-3-4b',
        is_reachable: false,
        is_model_loaded: false,
        loaded_models: [],
        available_models: [],
        setup_instructions: ['Backend not responding or LM Studio server is offline.'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        Checking LM Studio...
      </div>
    );
  }

  const isHealthy = health.status === 'model_loaded' || (health.is_reachable && health.is_model_loaded);
  const isConnected = health.is_reachable && !health.is_model_loaded;

  return (
    <Link
      href="/settings"
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all text-xs cursor-pointer shadow-sm"
      title={isHealthy ? `Model active: ${health.configured_model}` : "LM Studio attention required"}
    >
      {isHealthy ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-emerald-400 group-hover:underline">LM Studio Online</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">({health.configured_model.split('/').pop()})</span>
        </>
      ) : isConnected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-medium text-amber-400">No Model Loaded</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="font-medium text-rose-400">LM Studio Offline</span>
        </>
      )}
    </Link>
  );
}
