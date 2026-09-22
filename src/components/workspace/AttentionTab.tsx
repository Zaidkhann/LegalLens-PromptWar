"use client";

import React from 'react';
import { 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert,
  Info
} from 'lucide-react';

interface AttentionTabProps {
  onSelectClausePage?: (page: number, sectionId: string) => void;
}

export function AttentionTab({ onSelectClausePage }: AttentionTabProps) {
  const attentionItems = [
    {
      id: '8.2',
      page: 4,
      clauseTitle: 'Clause 8.2 - Forfeiture of Deposit + 60-Day Penalty',
      severity: 'High Attention',
      clauseSays: 'The tenant forfeits the full $4,800 security deposit AND remains responsible for paying 60 days of additional rent if breaking the lease before 24 months.',
      whyItMatters: 'This double-penalty clause is more restrictive than standard rental agreements, which usually charge either a 1-month fee OR forfeit deposit, but rarely both.',
      whatToClarify: 'Ask the landlord if the early termination penalty can be amended to a single flat fee equal to 1 month rent ($2,400) upon 30 days notice.',
    },
    {
      id: '8.1',
      page: 4,
      clauseTitle: 'Clause 8.1 - 90-Day Renewal Window Requirement',
      severity: 'High Attention',
      clauseSays: 'Failure to submit a written non-renewal notice at least 90 days before lease expiration automatically triggers a 12-month auto-renewal.',
      whyItMatters: 'Standard leases typically require 30 or 60 days notice. Missing the 90-day window locks you into a full second year.',
      whatToClarify: 'Set a calendar reminder for August 2, 2028 (90 days before expiration) and verify whether email notification is acceptable.',
    },
    {
      id: '3.1',
      page: 2,
      clauseTitle: 'Clause 3.1 - Escalating Daily Late Fees ($25/day)',
      severity: 'Moderate Attention',
      clauseSays: 'A $150 flat fee applies after the 5th, plus $25 per day continuously until full payment is received.',
      whyItMatters: 'Daily compounding late fees can escalate rapidly if a payment issue arises while traveling.',
      whatToClarify: 'Check if automatic bank transfer can be set up to eliminate late payment risks.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-amber-300">About LegalLens Attention Signals:</strong>
          <p className="text-amber-200/90 leading-relaxed">
            LegalLens highlights clauses that may be non-standard, restrictive, or deserving of closer review before signing. These signals are educational and do not constitute formal legal invalidity claims.
          </p>
        </div>
      </div>

      {/* Attention Cards List */}
      <div className="space-y-5">
        {attentionItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-4 shadow-lg hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  {item.severity}
                </span>
              </div>

              <button
                onClick={() => onSelectClausePage && onSelectClausePage(item.page, item.id)}
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"
              >
                <span>Page {item.page}, Sec {item.id}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <h3 className="text-sm font-bold text-white">{item.clauseTitle}</h3>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* What the clause says */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-400">1. What the clause says</span>
                <p className="text-slate-200 leading-relaxed">{item.clauseSays}</p>
              </div>

              {/* Why it matters */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">2. Why it deserves attention</span>
                <p className="text-slate-200 leading-relaxed">{item.whyItMatters}</p>
              </div>

              {/* What to clarify */}
              <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 space-y-1">
                <span className="font-bold text-brand-300">3. Recommended point to clarify</span>
                <p className="text-slate-200 leading-relaxed">{item.whatToClarify}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
