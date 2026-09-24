"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GitCompare, 
  Upload, 
  FileText, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  MinusCircle, 
  PlusCircle, 
  Edit3,
  Sparkles,
  Loader2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface DocumentOption {
  id: string;
  original_filename: string;
  title: string;
  file_type: string;
  file_size: number;
  page_count: number;
}

export interface ComparisonChangeItem {
  id: string;
  section: string;
  change_type: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  original_text: string;
  revised_text: string;
  explanation: string;
  attention_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  page_original?: number | null;
  page_revised?: number | null;
  is_important?: boolean;
}

export interface ComparisonData {
  comparison_id: string;
  document_a_id: string;
  document_b_id: string;
  document_a_title: string;
  document_b_title: string;
  summary: string;
  total_changes: number;
  added_count: number;
  removed_count: number;
  modified_count: number;
  important_changes_count: number;
  important_changes: string[];
  changes: ComparisonChangeItem[];
  disclaimer?: string;
}

export default function ComparePage() {
  const router = useRouter();

  // Document selection state
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [selectedDocAId, setSelectedDocAId] = useState<string>('');
  const [selectedDocBId, setSelectedDocBId] = useState<string>('');

  // Comparison execution state
  const [comparing, setComparing] = useState(false);
  const [comparisonStage, setComparisonStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'modified' | 'added' | 'removed' | 'important'>('all');

  // Fetch available documents on page mount
  useEffect(() => {
    async function fetchDocs() {
      try {
        setLoadingDocs(true);
        const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          if (data.length >= 2) {
            setSelectedDocAId(data[1].id);
            setSelectedDocBId(data[0].id);
          } else if (data.length === 1) {
            setSelectedDocAId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load documents list:", err);
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchDocs();
  }, []);

  const handleStartComparison = async () => {
    if (!selectedDocAId || !selectedDocBId) {
      setError("Please select both Document A and Document B.");
      return;
    }

    if (selectedDocAId === selectedDocBId) {
      setError("Document A and Document B cannot be the same file.");
      return;
    }

    setError(null);
    setComparing(true);
    setComparisonStage("Preparing documents...");

    const t1 = setTimeout(() => setComparisonStage("Matching sections..."), 1000);
    const t2 = setTimeout(() => setComparisonStage("Detecting text differences..."), 2200);
    const t3 = setTimeout(() => setComparisonStage("Analyzing legal changes with Gemini..."), 3600);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_a_id: selectedDocAId,
          document_b_id: selectedDocBId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to compare documents.");
      }

      const data = await res.json();
      setComparisonResult(data.comparison);
    } catch (err: any) {
      setError(err.message || "An error occurred during document comparison.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setComparing(false);
      setComparisonStage("");
    }
  };

  const docAObj = documents.find((d) => d.id === selectedDocAId);
  const docBObj = documents.find((d) => d.id === selectedDocBId);

  const filteredChanges = (comparisonResult?.changes || []).filter((change) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'important') return change.is_important || change.attention_level === 'HIGH';
    return change.change_type.toLowerCase() === selectedFilter;
  });

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

      {/* Document Selectors Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A Selector */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document A (Original Base Version)</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">V1</span>
          </div>

          {loadingDocs ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" /> Loading available documents...
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              <select
                value={selectedDocAId}
                onChange={(e) => setSelectedDocAId(e.target.value)}
                disabled={comparing}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="" disabled>-- Select Document A --</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.file_type.toUpperCase()} • {doc.page_count} pages)
                  </option>
                ))}
              </select>
              {docAObj && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="truncate text-slate-300 font-medium">{docAObj.original_filename}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{docAObj.page_count} Pages</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center space-y-2">
              <p>No uploaded documents found.</p>
              <Link href="/upload" className="inline-block text-brand-400 underline font-medium">
                Upload Document 1
              </Link>
            </div>
          )}
        </div>

        {/* Document B Selector */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Document B (Revised Version)</span>
            <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">V2</span>
          </div>

          {loadingDocs ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading available documents...
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-2">
              <select
                value={selectedDocBId}
                onChange={(e) => setSelectedDocBId(e.target.value)}
                disabled={comparing}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="" disabled>-- Select Document B --</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.file_type.toUpperCase()} • {doc.page_count} pages)
                  </option>
                ))}
              </select>
              {docBObj && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate text-slate-300 font-medium">{docBObj.original_filename}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">{docBObj.page_count} Pages</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center space-y-2">
              <p>No uploaded documents found.</p>
              <Link href="/upload" className="inline-block text-indigo-400 underline font-medium">
                Upload Document 2
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Start Comparison CTA Button */}
      <div className="flex flex-col items-center justify-center space-y-3">
        {error && (
          <div className="px-4 py-2.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 max-w-lg">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleStartComparison}
          disabled={comparing || !selectedDocAId || !selectedDocBId || selectedDocAId === selectedDocBId}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs tracking-wide shadow-glow transition-all flex items-center gap-2"
        >
          {comparing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{comparisonStage || 'Comparing Documents...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Compare Contract Versions</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Comparison Results Section */}
      {comparisonResult && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Executive Comparison Summary
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Comparison ID: {comparisonResult.comparison_id.slice(0, 8)}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {comparisonResult.summary}
            </p>

            {/* Top Highlights List */}
            {comparisonResult.important_changes && comparisonResult.important_changes.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Key Highlights:</span>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {comparisonResult.important_changes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Diff Matrix Summary Bar & Filter Pills */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
              <span className="text-slate-300">Detected Matrix:</span>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                {comparisonResult.total_changes} Total
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {comparisonResult.modified_count} Modified
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                {comparisonResult.added_count} Added
              </span>
              <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                {comparisonResult.removed_count} Removed
              </span>
              {comparisonResult.important_changes_count > 0 && (
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-indigo-400" />
                  {comparisonResult.important_changes_count} Important
                </span>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'modified', 'added', 'removed', 'important'] as const).map((filter) => (
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

          {/* Comparison Diff Cards List */}
          <div className="space-y-4">
            {filteredChanges.length > 0 ? (
              filteredChanges.map((change) => (
                <div
                  key={change.id}
                  className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{change.section}</span>
                      {change.is_important && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          IMPORTANT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase ${
                        change.change_type === 'MODIFIED'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : change.change_type === 'ADDED'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : change.change_type === 'REMOVED'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {change.change_type}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Text Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Document A (Original) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Version 1 (Original)</span>
                          {change.page_original && (
                            <Link
                              href={`/workspace/${selectedDocAId}`}
                              className="text-[10px] text-brand-400 hover:underline flex items-center gap-0.5"
                            >
                              Page {change.page_original} <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                        <p className={`font-mono text-xs leading-relaxed ${
                          change.change_type === 'REMOVED' ? 'text-rose-300/90 line-through' : 'text-slate-300'
                        }`}>
                          {change.original_text || 'N/A (Section did not exist in Version 1)'}
                        </p>
                      </div>
                    </div>

                    {/* Document B (Revised) */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase">Version 2 (Revised)</span>
                          {change.page_revised && (
                            <Link
                              href={`/workspace/${selectedDocBId}`}
                              className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                            >
                              Page {change.page_revised} <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}
                        </div>
                        <p className={`font-mono text-xs leading-relaxed ${
                          change.change_type === 'ADDED' ? 'text-emerald-300' : 'text-slate-200'
                        }`}>
                          {change.revised_text || 'N/A (Section removed in Version 2)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plain Language Impact Analysis Box */}
                  <div className="p-3.5 rounded-xl bg-brand-950/20 border border-brand-500/30 text-xs space-y-1">
                    <span className="font-bold text-brand-300 flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      Plain-Language Impact Explanation:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{change.explanation}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 border border-slate-800 rounded-2xl">
                No changes matching the selected filter "{selectedFilter}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
