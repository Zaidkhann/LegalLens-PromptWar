"use client";

import React, { useState, useCallback } from 'react';
import { 
  UserCheck, 
  Copy, 
  CheckCheck,
  HelpCircle, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface LawyerPrepTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
}

export const LawyerPrepTab = React.memo(function LawyerPrepTab({ analysis, isReady }: LawyerPrepTabProps) {
  const [copied, setCopied] = useState(false);
  const questionsToDisplay = analysis?.lawyer_questions || [];
  const attentionSignals = analysis?.attention_signals || [];

  // Build a plain-text lawyer brief for clipboard export
  const buildBriefText = useCallback(() => {
    const lines: string[] = [
      "LEGALLENS — LAWYER CONSULTATION BRIEFING SHEET",
      "=".repeat(50),
      "",
      "SECTION 1: RECOMMENDED QUESTIONS FOR YOUR LAWYER",
      "-".repeat(50),
    ];

    if (questionsToDisplay.length > 0) {
      questionsToDisplay.forEach((q, idx) => {
        lines.push(`${idx + 1}. "${q.question}"`);
        if (q.context) lines.push(`   Context: ${q.context}${q.page_number ? ` (Page ${q.page_number})` : ''}`);
        lines.push("");
      });
    } else {
      lines.push("No questions generated yet.");
      lines.push("");
    }

    lines.push("SECTION 2: HIGH-ATTENTION CLAUSES FOR REVIEW");
    lines.push("-".repeat(50));
    if (attentionSignals.length > 0) {
      attentionSignals.slice(0, 5).forEach((sig, idx) => {
        lines.push(`${idx + 1}. ${sig.title || 'Attention Point'} [${sig.severity || 'HIGH'}]`);
        if (sig.page_number) lines.push(`   Page: ${sig.page_number}`);
        lines.push("");
      });
    } else {
      lines.push("No high-attention clauses flagged.");
      lines.push("");
    }

    lines.push("SECTION 3: SUPPORTING DOCUMENTS TO BRING");
    lines.push("-".repeat(50));
    lines.push("✓ Executed copy of this document");
    lines.push("✓ Correspondence or addendums exchanged with counterparty");
    lines.push("✓ Proof of payments / deposit receipts if applicable");
    lines.push("");
    lines.push("─".repeat(50));
    lines.push("DISCLAIMER: LegalLens provides informational assistance only.");
    lines.push("This sheet does not constitute legal advice. Consult a qualified attorney.");

    return lines.join("\n");
  }, [questionsToDisplay, attentionSignals]);

  const handleCopyBrief = async () => {
    try {
      const text = buildBriefText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const el = window.document.createElement("textarea");
      el.value = buildBriefText();
      window.document.body.appendChild(el);
      el.select();
      window.document.execCommand("copy");
      window.document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" role="region" aria-label="Lawyer Consultation Briefing Sheet">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-400" aria-hidden="true" />
              Lawyer Consultation Briefing Sheet
            </h3>
            <p className="text-xs text-slate-400">
              Generated from your document to help you prepare for a meeting with a licensed legal professional.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyBrief}
              disabled={!isReady}
              aria-label={copied ? "Brief copied to clipboard" : "Copy brief to clipboard"}
              className={`flex items-center gap-2 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none disabled:opacity-40 ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
              }`}
            >
              {copied ? (
                <><CheckCheck className="w-4 h-4" />Copied!</>
              ) : (
                <><Copy className="w-4 h-4" />Copy Brief</>
              )}
            </button>
            {/* Print */}
            <button
              onClick={handlePrint}
              aria-label="Print this briefing sheet"
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition-all focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
            >
              <Printer className="w-4 h-4" />
              Print Brief
            </button>
          </div>
        </div>
      </div>

      {/* Brief Sections */}
      <div className="space-y-5">
        {/* Recommended Questions to Ask */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-brand-400" aria-hidden="true" />
            1. Recommended Questions to Ask Your Lawyer
          </h4>

          {!isReady ? (
            <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <p className="text-xs text-slate-400">Pending Analysis...</p>
            </div>
          ) : questionsToDisplay.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <AlertCircle className="w-5 h-5 text-slate-500 mx-auto" aria-hidden="true" />
              <p className="text-xs text-slate-400">No lawyer-preparation questions were generated for this document.</p>
            </div>
          ) : (
            <ul className="space-y-2 text-xs text-slate-200" role="list" aria-label="Recommended lawyer questions">
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
            <FileText className="w-4 h-4 text-amber-400" aria-hidden="true" />
            2. High-Attention Clauses for Legal Review
          </h4>
          <div className="space-y-2 text-xs" role="list" aria-label="High-attention clauses">
            {attentionSignals.length > 0 ? (
              attentionSignals.slice(0, 5).map((sig, idx) => (
                <div key={idx} role="listitem" className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <div>
                    <strong className="text-slate-200">{sig.title || 'Attention Point'}</strong>
                    <p className="text-slate-400 text-[11px]">
                      {sig.page_number ? `Page ${sig.page_number}` : ''} {sig.source_reference ? `• ${sig.source_reference}` : ''}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase"
                    aria-label={`Severity: ${sig.severity || 'HIGH'}`}
                  >
                    {sig.severity || 'HIGH'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isReady ? "No specific high-attention clauses flagged for legal review." : "Pending Analysis..."}
              </p>
            )}
          </div>
        </div>

        {/* Information & Documents to Bring */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            3. Information &amp; Supporting Documents to Bring
          </h4>
          <ul className="space-y-2 text-xs text-slate-300" role="list" aria-label="Documents to bring to lawyer consultation">
            <li className="flex items-center gap-2">✓ Executed copy of this document</li>
            <li className="flex items-center gap-2">✓ Correspondence or addendums exchanged with counterparty</li>
            <li className="flex items-center gap-2">✓ Proof of payments / deposit receipts if applicable</li>
          </ul>
        </div>

        {/* Legal Safety Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400">Disclaimer: </span>
          This briefing sheet is generated by LegalLens AI from your uploaded document for informational purposes only. 
          It does not constitute legal advice and does not replace a consultation with a qualified, licensed attorney.
        </div>
      </div>
    </div>
  );
});
