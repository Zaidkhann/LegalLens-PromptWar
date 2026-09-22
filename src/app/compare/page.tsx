"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GitCompare, 
  Upload, 
  Plus, 
  FileText, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  MinusCircle, 
  PlusCircle, 
  Edit3,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function ComparePage() {
  const [docA, setDocA] = useState<{ name: string; size: string } | null>({
    name: 'Rental_Agreement_V1_Original.pdf',
    size: '2.1 MB',
  });

  const [docB, setDocB] = useState<{ name: string; size: string } | null>({
    name: 'Rental_Agreement_V2_Landlord_Edit.pdf',
    size: '2.3 MB',
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'added' | 'removed' | 'modified'>('all');

  const comparisonChanges = [
    {
      id: '1',
      type: 'modified',
      clause: 'Clause 8.1 - Expiration and Renewal Notice Period',
      oldText: 'Notice of intent not to renew shall be provided no less than 30 calendar days prior...',
      newText: 'Notice of intent not to renew shall be provided no less than 90 calendar days prior...',
      impact: 'High Attention Change: Landlord extended the non-renewal notice window from 30 days to 90 days.',
    },
    {
      id: '2',
      type: 'added',
      clause: 'Clause 16.3 - Pet Policy Surcharge',
      oldText: 'N/A (Clause did not exist in Version 1)',
      newText: 'Lessee agrees to pay a non-refundable $500 pet fee plus $50/month pet rent for authorized pets...',
      impact: 'New Obligation Added: A $500 one-time fee and monthly $50 pet rent was added to Version 2.',
    },
    {
      id: '3',
      type: 'removed',
      clause: 'Clause 12.1 - Landlord Maintenance Response Guarantee',
      oldText: 'Lessor guarantees emergency plumbing repair response within 24 hours of written notification...',
      newText: 'N/A (Clause removed in Version 2)',
      impact: 'Protection Removed: Landlord removed the 24-hour emergency plumbing response guarantee.',
    },
  ];

  const filteredChanges = comparisonChanges.filter(
    (c) => selectedFilter === 'all' || c.type === selectedFilter
  );

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <GitCompare className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Contract Version Comparison</h1>
        </div>
        <p className="text-xs text-slate-400">
          Compare two contract versions side-by-side to identify added, removed, or modified terms in plain language.
        </p>
      </div>

      {/* Upload Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document A (Original Base Version)</span>
          {docA ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-400" />
                <div>
                  <h4 className="font-bold text-white">{docA.name}</h4>
                  <span className="text-slate-400">{docA.size}</span>
                </div>
              </div>
              <button onClick={() => setDocA(null)} className="text-xs text-slate-500 hover:text-slate-300">Change</button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 p-6 rounded-xl text-center cursor-pointer text-xs text-slate-400">
              <Upload className="w-6 h-6 mx-auto text-slate-500 mb-2" />
              Upload Version 1 (Original)
            </div>
          )}
        </div>

        {/* Document B */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Document B (Revised Version)</span>
          {docB ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-white">{docB.name}</h4>
                  <span className="text-slate-400">{docB.size}</span>
                </div>
              </div>
              <button onClick={() => setDocB(null)} className="text-xs text-slate-500 hover:text-slate-300">Change</button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 p-6 rounded-xl text-center cursor-pointer text-xs text-slate-400">
              <Upload className="w-6 h-6 mx-auto text-slate-500 mb-2" />
              Upload Version 2 (Revised)
            </div>
          )}
        </div>
      </div>

      {/* Diff Matrix Summary Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-slate-300">Comparison Summary:</span>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
            1 Modified
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            1 Added
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
            1 Removed
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {(['all', 'modified', 'added', 'removed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedFilter === filter
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Cards List */}
      <div className="space-y-4">
        {filteredChanges.map((change) => (
          <div
            key={change.id}
            className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{change.clause}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
                change.type === 'modified'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : change.type === 'added'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {change.type}
              </span>
            </div>

            {/* Side-by-side Text Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Version 1 (Original)</span>
                <p className="font-mono text-slate-300">{change.oldText}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Version 2 (Revised)</span>
                <p className="font-mono text-slate-200">{change.newText}</p>
              </div>
            </div>

            {/* Plain Language Impact */}
            <div className="p-3 rounded-xl bg-brand-950/20 border border-brand-500/30 text-xs space-y-1">
              <span className="font-bold text-brand-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Plain-Language Impact Analysis:
              </span>
              <p className="text-slate-200 leading-relaxed">{change.impact}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
