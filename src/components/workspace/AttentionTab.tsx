"use client";

import React from 'react';
import { 
  AlertTriangle, 
  ExternalLink, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface AttentionTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
  onSelectClausePage?: (page: number, sectionId: string) => void;
}

export function AttentionTab({ analysis, isReady, onSelectClausePage }: AttentionTabProps) {
  const aiSignals = analysis?.attention_signals || [];

  const sampleSignals = [
    {
      title: 'Clause 8.2 - Forfeiture of Deposit + 60-Day Penalty',
      severity: 'HIGH',
      what_it_says: 'The tenant forfeits the full $4,800 security deposit AND remains responsible for paying 60 days of additional rent if breaking the lease before 24 months.',
      why_it_matters: 'This double-penalty clause is more restrictive than standard rental agreements, which usually charge either a 1-month fee OR forfeit deposit, but rarely both.',
      clarification_needed: 'Ask the landlord if the early termination penalty can be amended to a single flat fee equal to 1 month rent ($2,400) upon 30 days notice.',
      page_number: 4,
      source_reference: 'Clause 8.2',
    },
    {
      title: 'Clause 8.1 - 90-Day Renewal Window Requirement',
      severity: 'HIGH',
      what_it_says: 'Failure to submit a written non-renewal notice at least 90 days before lease expiration automatically triggers a 12-month auto-renewal.',
      why_it_matters: 'Standard leases typically require 30 or 60 days notice. Missing the 90-day window locks you into a full second year.',
      clarification_needed: 'Set a calendar reminder for August 2, 2028 (90 days before expiration) and verify whether email notification is acceptable.',
      page_number: 4,
      source_reference: 'Clause 8.1',
    },
    {
      title: 'Clause 3.1 - Escalating Daily Late Fees ($25/day)',
      severity: 'MEDIUM',
      what_it_says: 'A $150 flat fee applies after the 5th, plus $25 per day continuously until full payment is received.',
      why_it_matters: 'Daily compounding late fees can escalate rapidly if a payment issue arises while traveling.',
      clarification_needed: 'Check if automatic bank transfer can be set up to eliminate late payment risks.',
      page_number: 2,
      source_reference: 'Clause 3.1',
    },
  ];

  const signalsToDisplay = isReady && aiSignals.length > 0 ? aiSignals : sampleSignals;

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
        {signalsToDisplay.map((item, idx) => {
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
        })}
      </div>
    </div>
  );
}
