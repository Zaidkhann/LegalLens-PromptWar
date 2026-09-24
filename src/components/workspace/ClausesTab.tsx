"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Search,
  AlertCircle
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface ClausesTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
  onSelectClausePage?: (page: number, sectionId: string) => void;
}

export function ClausesTab({ analysis, isReady, onSelectClausePage }: ClausesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Payment',
    'Termination',
    'Renewal',
    'Liability',
    'Confidentiality',
    'Restrictions',
    'Dispute Resolution',
    'Notice',
    'Obligations',
    'Penalties',
    'Other',
  ];

  // Map AI clauses directly from backend analysis
  const clausesToDisplay = analysis?.important_clauses || [];

  const filteredClauses = clausesToDisplay.filter((c) => {
    const catMatch = selectedCategory === 'All' || (c.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase();
    const textMatch = 
      (c.title || '').toLowerCase().includes(query) ||
      (c.plain_explanation || '').toLowerCase().includes(query) ||
      (c.original_text || '').toLowerCase().includes(query);
    return catMatch && textMatch;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search extracted clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses Cards List */}
      <div className="space-y-4">
        {!isReady ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <FileText className="w-6 h-6 text-brand-400 mx-auto" />
            <p className="text-xs text-slate-300">Run document analysis to extract important legal clauses.</p>
          </div>
        ) : filteredClauses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              {clausesToDisplay.length === 0 
                ? "No important clauses were identified in this document." 
                : "No clauses match your filter criteria."}
            </p>
          </div>
        ) : (
          filteredClauses.map((clause, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-500/10 text-brand-300 px-2.5 py-0.5 rounded text-[11px] font-semibold border border-brand-500/20">
                    {clause.category || 'General'}
                  </span>
                  {clause.source_reference && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {clause.source_reference}
                    </span>
                  )}
                </div>

                {/* Source Page Citation Chip */}
                {clause.page_number && (
                  <button
                    onClick={() => onSelectClausePage && onSelectClausePage(clause.page_number!, clause.source_reference || `page-${clause.page_number}`)}
                    className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:border-brand-500/40 transition-colors"
                  >
                    <span>Page {clause.page_number}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <h4 className="text-sm font-bold text-white">{clause.title || `Clause: ${clause.category}`}</h4>

              {/* Plain Language Explanation */}
              {clause.plain_explanation && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">What does this mean?</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{clause.plain_explanation}</p>
                </div>
              )}

              {/* Raw Contract Text */}
              {clause.original_text && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                  &quot;{clause.original_text}&quot;
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
