"use client";

import React from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface AttentionTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
  onSelectClausePage?: (page: number, sectionId: string) => void;
}

export function AttentionTab({ analysis, isReady, onSelectClausePage }: AttentionTabProps) {
  const signalsToDisplay = analysis?.attention_signals || [];

  return (
    <div className="space-y-6">
      {/* Intro Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-amber-300">About LegalLens Attention Signals:</strong>
          <p className="text-amber-200/90 leading-relaxed">
            LegalLens highlights clauses that may be non-standard, restrictive, or deserving of closer review before signing. These signals are educational and do not constitute formal legal advice.
          </p>
        </div>
      </div>

      {/* Attention Cards List */}
      <div className="space-y-5">
        {!isReady ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-xs text-slate-300">Pending Analysis...</p>
          </div>
        ) : signalsToDisplay.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No High-Risk Attention Points Detected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No specific attention items were identified in this document. Always perform a thorough full reading before signing.
            </p>
          </div>
        ) : (
          signalsToDisplay.map((item, idx) => {
            const severity = (item.severity || 'MEDIUM').toUpperCase();
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-4 shadow-lg hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 border ${
                      severity === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : severity === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {severity} SEVERITY
                    </span>
                    {item.source_reference && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {item.source_reference}
                      </span>
                    )}
                  </div>

                  {item.page_number && (
                    <button
                      onClick={() => onSelectClausePage && onSelectClausePage(item.page_number!, item.source_reference || `page-${item.page_number}`)}
                      className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"
                    >
                      <span>Page {item.page_number}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white">{item.title || 'Attention Point'}</h3>

                <div className="grid grid-cols-1 gap-3 text-xs">
                  {/* What the clause says */}
                  {item.what_it_says && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-slate-400">1. What the clause says</span>
                      <p className="text-slate-200 leading-relaxed">{item.what_it_says}</p>
                    </div>
                  )}

                  {/* Why it matters */}
                  {item.why_it_matters && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-400">2. Why it deserves attention</span>
                      <p className="text-slate-200 leading-relaxed">{item.why_it_matters}</p>
                    </div>
                  )}

                  {/* What to clarify */}
                  {item.clarification_needed && (
                    <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 space-y-1">
                      <span className="font-bold text-brand-300">3. Recommended point to clarify</span>
                      <p className="text-slate-200 leading-relaxed">{item.clarification_needed}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
