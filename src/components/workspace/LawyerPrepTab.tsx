"use client";

import React from 'react';
import { 
  UserCheck, 
  Download, 
  HelpCircle, 
  FileText, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface LawyerPrepTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
}

export function LawyerPrepTab({ analysis, isReady }: LawyerPrepTabProps) {
  const questionsToDisplay = analysis?.lawyer_questions || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-400" />
              Lawyer Consultation Briefing Sheet
            </h3>
            <p className="text-xs text-slate-400">
              Generated summary to help you prepare efficiently for a meeting with a licensed legal professional.
            </p>
          </div>
          <button
            onClick={() => alert("Lawyer Brief PDF Download triggered.")}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-all"
          >
            <Download className="w-4 h-4" />
            Download Brief (PDF)
          </button>
        </div>
      </div>

      {/* Brief Sections */}
      <div className="space-y-5">
        {/* Recommended Questions to Ask */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-brand-400" />
            1. Recommended Questions to Ask Your Lawyer
          </h4>

          {!isReady ? (
            <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <p className="text-xs text-slate-400">Pending Analysis...</p>
            </div>
          ) : questionsToDisplay.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <AlertCircle className="w-5 h-5 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">No lawyer-preparation questions were generated for this document.</p>
            </div>
          ) : (
            <ul className="space-y-2 text-xs text-slate-200">
              {questionsToDisplay.map((q, idx) => (
                <li key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <p className="font-medium text-slate-100">• &quot;{q.question}&quot;</p>
                  {q.context && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Context: {q.context} {q.page_number ? `(Page ${q.page_number})` : ''}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clauses to Request Review */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            2. High-Attention Clauses for Legal Review
          </h4>
          <div className="space-y-2 text-xs">
            {analysis?.attention_signals && analysis.attention_signals.length > 0 ? (
              analysis.attention_signals.slice(0, 5).map((sig, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-200">{sig.title || 'Attention Point'}</strong>
                    <p className="text-slate-400 text-[11px]">
                      {sig.page_number ? `Page ${sig.page_number}` : ''} {sig.source_reference ? `• ${sig.source_reference}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                    {sig.severity || 'HIGH'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No specific high-attention clauses flagged for legal review.</p>
            )}
          </div>
        </div>

        {/* Information & Documents to Bring */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            3. Information & Supporting Documents to Bring
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">✓ Executed copy of this document</li>
            <li className="flex items-center gap-2">✓ Correspondence or addendums exchanged with counterparty</li>
            <li className="flex items-center gap-2">✓ Proof of payments / deposit receipts if applicable</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
