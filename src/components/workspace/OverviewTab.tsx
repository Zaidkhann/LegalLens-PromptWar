"use client";

import React from 'react';
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  ShieldCheck
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface OverviewTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
}

export function OverviewTab({ analysis, isReady }: OverviewTabProps) {
  const overview = analysis?.overview;
  const plainLanguage = analysis?.plain_language;

  const docType = overview?.document_type || (isReady ? "Legal Document" : "Pending Analysis");
  const purpose = overview?.purpose || (isReady ? "Not specified in the document." : "Pending Analysis...");
  const parties = overview?.parties && overview.parties.length > 0 ? overview.parties : null;
  const financialTerms = overview?.financial_terms && overview.financial_terms.length > 0 ? overview.financial_terms : null;
  const keyDates = overview?.key_dates && overview.key_dates.length > 0 ? overview.key_dates : null;
  const duration = overview?.duration || (isReady ? "Not specified in the document." : "Pending Analysis...");
  const obligations = overview?.important_obligations && overview.important_obligations.length > 0 ? overview.important_obligations : null;
  const summaryText = plainLanguage?.summary || overview?.summary || (isReady ? "Not specified in the document." : "Extracting and generating plain-language overview...");
  const takeaways = plainLanguage?.key_takeaways || [];

  return (
    <div className="space-y-6">
      {/* Document Header Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-brand-500/10 text-brand-300 border border-brand-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {docType}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
            isReady 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {isReady ? 'Grounded AI Analysis' : 'Analysis Pending'}
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-white">{docType}</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {purpose}
        </p>
      </div>

      {/* Key Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Parties */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Users className="w-4 h-4 text-brand-400" />
            PARTIES INVOLVED
          </div>
          <div className="space-y-1 text-xs">
            {parties ? (
              parties.map((p, idx) => (
                <p key={idx} className="text-slate-200 font-medium">• {p}</p>
              ))
            ) : (
              <p className="text-slate-400 font-normal italic">{isReady ? "Not specified in the document." : "Pending Analysis..."}</p>
            )}
          </div>
        </div>

        {/* Financial Commitments */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            FINANCIAL TERMS
          </div>
          <div className="space-y-1 text-xs">
            {financialTerms ? (
              financialTerms.map((f, idx) => (
                <p key={idx} className="text-slate-200 font-medium">• {f}</p>
              ))
            ) : (
              <p className="text-slate-400 font-normal italic">{isReady ? "Not specified in the document." : "Pending Analysis..."}</p>
            )}
          </div>
        </div>

        {/* Key Dates & Duration */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Calendar className="w-4 h-4 text-indigo-400" />
            KEY DATES & DURATION
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-200"><strong>Duration:</strong> {duration}</p>
            {keyDates ? (
              keyDates.map((d, idx) => (
                <p key={idx} className="text-slate-200 font-medium">• {d}</p>
              ))
            ) : (
              <p className="text-slate-400 font-normal italic">Key dates: {isReady ? "Not specified in the document." : "Pending Analysis..."}</p>
            )}
          </div>
        </div>

        {/* Key Obligations */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            PRIMARY OBLIGATIONS
          </div>
          <div className="space-y-1 text-xs">
            {obligations ? (
              obligations.map((o, idx) => (
                <p key={idx} className="text-slate-200 font-medium">• {o}</p>
              ))
            ) : (
              <p className="text-slate-400 font-normal italic">{isReady ? "Not specified in the document." : "Pending Analysis..."}</p>
            )}
          </div>
        </div>
      </div>

      {/* Executive Plain-Language Summary Box */}
      <div className="p-5 rounded-2xl bg-brand-950/20 border border-brand-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            Plain-Language Executive Summary
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            {isReady ? 'Grounded AI Output' : 'Pending Analysis'}
          </span>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>{summaryText}</p>

          {takeaways.length > 0 && (
            <div className="pt-2 border-t border-brand-500/20 space-y-1.5">
              <strong className="text-brand-300 font-semibold">Key Takeaways for You:</strong>
              {takeaways.map((t, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-200">
                  <span className="text-brand-400 font-bold">•</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
