"use client";

import React from 'react';
import { 
  UserCheck, 
  Download, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  Printer,
  Sparkles
} from 'lucide-react';

export function LawyerPrepTab() {
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
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-glow transition-all"
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
          <ul className="space-y-2 text-xs text-slate-200">
            <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              • &quot;Is the early termination clause (Section 8.2) demanding both deposit forfeiture AND 60 days liquidated damages enforceable under Washington state landlord-tenant law?&quot;
            </li>
            <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              • &quot;What language should I propose to limit my liability for property damage caused by external plumbing failures (Section 12.4)?&quot;
            </li>
            <li className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              • &quot;Does the 90-day non-renewal notice requirement comply with local housing ordinance notice standards?&quot;
            </li>
          </ul>
        </div>

        {/* Clauses to Request Review */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            2. Specific Clauses to Request Professional Review
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <strong className="text-slate-200">Clause 8.2 - Early Termination Penalties</strong>
                <p className="text-slate-400 text-[11px]">Page 4 • Forfeiture + 60 days liquidated damages</p>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">High Priority</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <strong className="text-slate-200">Clause 12.4 - Indemnification & Property Waiver</strong>
                <p className="text-slate-400 text-[11px]">Page 6 • Waiver of landlord liability for leak damage</p>
              </div>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">Moderate</span>
            </div>
          </div>
        </div>

        {/* Information & Documents to Bring */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            3. Information & Supporting Documents to Bring
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">✓ Executed copy of current Residential Lease Agreement</li>
            <li className="flex items-center gap-2">✓ Move-in Condition Inspection Form & Photos</li>
            <li className="flex items-center gap-2">✓ Rent payment receipts / bank statements for deposit proof</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
