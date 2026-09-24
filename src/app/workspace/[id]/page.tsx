"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  BookOpen, 
  AlertTriangle, 
  MessageSquare, 
  CheckSquare, 
  UserCheck,
  ChevronLeft,
  Share2,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';
import Link from 'next/link';

import { DocumentViewer, DocumentContentData } from '@/components/workspace/DocumentViewer';
import { OverviewTab } from '@/components/workspace/OverviewTab';
import { ClausesTab } from '@/components/workspace/ClausesTab';
import { AttentionTab } from '@/components/workspace/AttentionTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { ChecklistTab } from '@/components/workspace/ChecklistTab';
import { LawyerPrepTab } from '@/components/workspace/LawyerPrepTab';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// ─── Analysis types matching backend schemas ─────────────────────────────────

interface DocumentOverview {
  document_type?: string | null;
  purpose?: string | null;
  parties?: string[];
  key_dates?: string[];
  financial_terms?: string[];
  duration?: string | null;
  important_obligations?: string[];
  summary?: string | null;
}

interface PlainLanguageExplanation {
  summary?: string | null;
  key_takeaways?: string[];
}

interface ImportantClause {
  category?: string | null;
  title?: string | null;
  original_text?: string | null;
  plain_explanation?: string | null;
  page_number?: number | null;
  source_reference?: string | null;
}

interface AttentionSignal {
  title?: string | null;
  category?: string | null;
  severity?: string | null;
  what_it_says?: string | null;
  why_it_matters?: string | null;
  clarification_needed?: string | null;
  page_number?: number | null;
  source_reference?: string | null;
}

interface Obligation {
  party?: string | null;
  obligation?: string | null;
  deadline?: string | null;
  condition?: string | null;
  page_number?: number | null;
}

interface ImportantDate {
  date?: string | null;
  description?: string | null;
  related_clause?: string | null;
  page_number?: number | null;
}

interface ActionItem {
  task?: string | null;
  category?: string | null;
  priority?: string | null;
  reason?: string | null;
  page_number?: number | null;
}

interface LawyerQuestion {
  question?: string | null;
  context?: string | null;
  page_number?: number | null;
}

export interface LegalAnalysisData {
  overview?: DocumentOverview | null;
  plain_language?: PlainLanguageExplanation | null;
  important_clauses?: ImportantClause[];
  attention_signals?: AttentionSignal[];
  obligations?: Obligation[];
  important_dates?: ImportantDate[];
  action_items?: ActionItem[];
  lawyer_questions?: LawyerQuestion[];
}

interface FullAnalysisResponse {
  document_id: string;
  analysis_status: 'not_started' | 'analyzing' | 'completed' | 'failed';
  analysis: LegalAnalysisData | null;
  disclaimer: string;
}

// ─── Progress steps shown during analysis ────────────────────────────────────

const ANALYSIS_PROGRESS_STEPS = [
  { label: 'Reading document content', icon: FileText, duration: 3000 },
  { label: 'Understanding document structure', icon: BookOpen, duration: 4000 },
  { label: 'Identifying important clauses', icon: Shield, duration: 5000 },
  { label: 'Detecting attention signals', icon: AlertTriangle, duration: 4000 },
  { label: 'Preparing action checklist', icon: CheckSquare, duration: 3000 },
  { label: 'Generating lawyer briefing', icon: UserCheck, duration: 2000 },
];

export default function DocumentWorkspacePage({ params }: { params: { id: string } }) {
  const documentId = params.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'attention' | 'chat' | 'checklist' | 'lawyer'>('overview');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);

  const [documentContent, setDocumentContent] = useState<DocumentContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [analysisData, setAnalysisData] = useState<LegalAnalysisData | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'not_started' | 'analyzing' | 'completed' | 'failed'>('not_started');
  const [analysisDisclaimer, setAnalysisDisclaimer] = useState<string>('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);

  // ── Fetch document content ─────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDocumentData() {
      if (!documentId) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/content`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Document with ID '${documentId}' not found.`);
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to load document content.');
        }

        const data: DocumentContentData = await res.json();
        setDocumentContent(data);
      } catch (err: any) {
        setError(err.message || 'Error connecting to backend service.');
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentData();
  }, [documentId]);

  // ── Trigger analysis ───────────────────────────────────────────────────────
  const handleStartAnalysis = useCallback(async () => {
    if (!documentId) return;
    setAnalysisStatus('analyzing');
    setAnalysisError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/analyze`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Analysis request failed.');
      }

      // Analysis completed, fetch results
      const resAnalysis = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/analysis`);
      if (resAnalysis.ok) {
        const data: FullAnalysisResponse = await resAnalysis.json();
        setAnalysisStatus(data.analysis_status);
        setAnalysisDisclaimer(data.disclaimer);
        if (data.analysis) {
          setAnalysisData(data.analysis);
        }
      }
    } catch (err: any) {
      setAnalysisStatus('failed');
      setAnalysisError(err.message || 'An error occurred during AI analysis.');
    }
  }, [documentId]);

  // ── Fetch analysis data ────────────────────────────────────────────────────
  const fetchAnalysis = useCallback(async () => {
    if (!documentId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/analysis`);
      if (!res.ok) return;
      const data: FullAnalysisResponse = await res.json();
      setAnalysisStatus(data.analysis_status);
      setAnalysisDisclaimer(data.disclaimer);
      if (data.analysis) {
        setAnalysisData(data.analysis);
      } else if (data.analysis_status === 'not_started') {
        // Auto-start analysis on first workspace load
        handleStartAnalysis();
      }
    } catch {
      // Silently fail — will retry
    }
  }, [documentId, handleStartAnalysis]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);


  // ── Polling while analyzing ────────────────────────────────────────────────
  useEffect(() => {
    if (analysisStatus !== 'analyzing') return;

    const interval = setInterval(() => {
      fetchAnalysis();
    }, 2000);

    return () => clearInterval(interval);
  }, [analysisStatus, fetchAnalysis]);

  // ── Progress animation during analysis ─────────────────────────────────────
  useEffect(() => {
    if (analysisStatus !== 'analyzing') return;
    setProgressStep(0);

    let step = 0;
    const advanceStep = () => {
      step++;
      if (step < ANALYSIS_PROGRESS_STEPS.length) {
        setProgressStep(step);
      }
    };

    const timers: NodeJS.Timeout[] = [];
    let cumulative = 0;
    for (let i = 1; i < ANALYSIS_PROGRESS_STEPS.length; i++) {
      cumulative += ANALYSIS_PROGRESS_STEPS[i - 1].duration;
      timers.push(setTimeout(advanceStep, cumulative));
    }

    return () => timers.forEach(clearTimeout);
  }, [analysisStatus]);


  const handleSelectCitation = (page: number, sectionId: string) => {
    setHighlightedSection(sectionId);
    setTargetPage(page);
  };

  const isAnalysisReady = analysisStatus === 'completed' && analysisData !== null;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Workspace Sub-Header */}
      <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight truncate max-w-[300px]">
                {documentContent?.title ? `${documentContent.title}.${documentContent.file_type}` : 'Loading Document...'}
              </h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase font-mono border ${
                isAnalysisReady
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : analysisStatus === 'analyzing'
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isAnalysisReady ? 'AI Analyzed' : analysisStatus === 'analyzing' ? 'Analyzing...' : documentContent?.file_type ? `${documentContent.file_type} Extracted` : 'Processing'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {documentContent ? `${documentContent.page_count} Pages • ${isAnalysisReady ? 'AI Legal Analysis Complete' : 'Ingested & Extracted'}` : 'LegalLens Document Ingestion'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Document analysis report sharing link copied to clipboard.')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            Share Workspace
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-sm font-medium text-slate-300">Retrieving extracted document pages...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-bold text-white">Document Loading Error</h3>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold"
          >
            Return to Upload
          </Link>
        </div>
      )}

      {/* Main Split Layout */}
      {!loading && !error && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* LEFT PANEL: Document Canvas / Viewer (5 cols) */}
          <div className="lg:col-span-5 p-4 bg-slate-950/40 border-r border-slate-800 flex flex-col h-full overflow-hidden">
            <DocumentViewer document={documentContent} highlightedSection={highlightedSection} targetPage={targetPage} />
          </div>

          {/* RIGHT PANEL: Intelligence Workspace (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-950 overflow-hidden">

            {/* Analysis CTA / Status Banner */}
            {analysisStatus === 'not_started' && (
              <div className="bg-gradient-to-r from-brand-950/60 to-indigo-950/40 border-b border-brand-500/30 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center shadow-glow">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">AI Legal Analysis Available</p>
                    <p className="text-[11px] text-slate-400">Run Gemini-powered analysis to identify clauses, risks, and action items</p>
                  </div>
                </div>
                <button
                  onClick={handleStartAnalysis}
                  className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-glow transition-all hover:shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  Start AI Legal Analysis
                </button>
              </div>
            )}

            {analysisStatus === 'analyzing' && (
              <div className="bg-gradient-to-r from-brand-950/60 to-indigo-950/40 border-b border-brand-500/30 px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                  <p className="text-sm font-bold text-white">AI Analysis In Progress</p>
                </div>
                <div className="space-y-2">
                  {ANALYSIS_PROGRESS_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = idx === progressStep;
                    const isDone = idx < progressStep;
                    return (
                      <div key={idx} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                        isActive ? 'text-brand-300 font-semibold' : isDone ? 'text-emerald-400' : 'text-slate-600'
                      }`}>
                        {isDone ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isActive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                        ) : (
                          <StepIcon className="w-3.5 h-3.5" />
                        )}
                        {step.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analysisStatus === 'failed' && (
              <div className="bg-rose-950/30 border-b border-rose-500/30 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span><strong>Analysis Failed:</strong> {analysisError || 'An error occurred during AI analysis.'}</span>
                </div>
                <button
                  onClick={handleStartAnalysis}
                  className="text-xs font-semibold text-rose-300 hover:text-white px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {isAnalysisReady && analysisDisclaimer && (
              <div className="bg-amber-950/20 border-b border-amber-500/20 px-4 py-2 text-[11px] text-amber-300/90 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {analysisDisclaimer}
              </div>
            )}

            {/* Tabs Bar */}
            <div className="flex items-center gap-1 px-4 pt-3 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'overview', label: 'Overview', icon: BookOpen },
                { id: 'clauses', label: 'Important Clauses', icon: FileText },
                { id: 'attention', label: 'Attention Signals', icon: AlertTriangle },
                { id: 'chat', label: 'Ask Document', icon: MessageSquare },
                { id: 'checklist', label: 'Action Checklist', icon: CheckSquare },
                { id: 'lawyer', label: 'Lawyer Prep', icon: UserCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                // Show count badges for certain tabs when analysis ready
                let count: number | null = null;
                if (isAnalysisReady && analysisData) {
                  if (tab.id === 'clauses') count = analysisData.important_clauses?.length || 0;
                  if (tab.id === 'attention') count = analysisData.attention_signals?.length || 0;
                  if (tab.id === 'checklist') count = analysisData.action_items?.length || 0;
                  if (tab.id === 'lawyer') count = analysisData.lawyer_questions?.length || 0;
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap border-t border-x transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-800 border-b-transparent shadow-sm'
                        : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-400' : 'text-slate-500'}`} />
                    {tab.label}
                    {count !== null && count > 0 && (
                      <span className="bg-brand-500/20 text-brand-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
              {activeTab === 'overview' && <OverviewTab analysis={analysisData} isReady={isAnalysisReady} />}
              {activeTab === 'clauses' && <ClausesTab analysis={analysisData} isReady={isAnalysisReady} onSelectClausePage={handleSelectCitation} />}
              {activeTab === 'attention' && <AttentionTab analysis={analysisData} isReady={isAnalysisReady} onSelectClausePage={handleSelectCitation} />}
              {activeTab === 'chat' && <ChatTab documentId={documentId} onSelectCitation={handleSelectCitation} analysisData={analysisData} />}
              {activeTab === 'checklist' && <ChecklistTab analysis={analysisData} isReady={isAnalysisReady} />}
              {activeTab === 'lawyer' && <LawyerPrepTab analysis={analysisData} isReady={isAnalysisReady} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
