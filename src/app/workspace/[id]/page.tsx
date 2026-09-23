"use client";

import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import { DocumentViewer, DocumentContentData } from '@/components/workspace/DocumentViewer';
import { OverviewTab } from '@/components/workspace/OverviewTab';
import { ClausesTab } from '@/components/workspace/ClausesTab';
import { AttentionTab } from '@/components/workspace/AttentionTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { ChecklistTab } from '@/components/workspace/ChecklistTab';
import { LawyerPrepTab } from '@/components/workspace/LawyerPrepTab';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DocumentWorkspacePage({ params }: { params: { id: string } }) {
  const documentId = params.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'attention' | 'chat' | 'checklist' | 'lawyer'>('overview');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const [documentContent, setDocumentContent] = useState<DocumentContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocumentData() {
      if (!documentId) return;

      // Handle demo fallback
      if (documentId === 'demo-doc-1') {
        setDocumentContent({
          document_id: 'demo-doc-1',
          title: 'Residential_Rental_Agreement_2026',
          file_type: 'pdf',
          page_count: 8,
          pages: [
            {
              page_number: 1,
              text: "RESIDENTIAL LEASE AGREEMENT\n\nThis Lease Agreement is entered into on October 1, 2026, by and between Lessor Properties LLC and John Doe.\n\nCLAUSE 1.1 - PREMISES AND TERM\nLessor agrees to lease the apartment located at 742 Evergreen Terrace for a term of 12 calendar months.",
              section_info: "SECTION I: PREMISES & TERM"
            },
            {
              page_number: 2,
              text: "CLAUSE 2.1 - RENT PAYMENT AND DEPOSIT\nRent is $2,400 per month payable on the 1st of each month. Late payment incurs a $100 penalty fee after 5 calendar days.",
              section_info: "SECTION II: RENT & DEPOSIT"
            }
          ]
        });
        setLoading(false);
        return;
      }

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

  const handleSelectCitation = (page: number, sectionId: string) => {
    setHighlightedSection(sectionId);
  };

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
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-mono">
                {documentContent?.file_type ? `${documentContent.file_type} Extracted` : 'Processing'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {documentContent ? `${documentContent.page_count} Pages • Ingested & Extracted` : 'LegalLens Document Ingestion'}
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
            <DocumentViewer document={documentContent} highlightedSection={highlightedSection} />
          </div>

          {/* RIGHT PANEL: Intelligence Workspace (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* Phase 2 Scope Banner */}
            <div className="bg-brand-950/40 border-b border-brand-500/20 px-4 py-2 text-[11px] text-brand-300 flex items-center justify-between">
              <span><strong>Phase 2 Active:</strong> Document Ingestion & Text Extraction complete.</span>
              <span className="text-[10px] text-brand-400/80 font-mono">AI Analysis Pipeline coming in Phase 3+</span>
            </div>

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
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'clauses' && <ClausesTab onSelectClausePage={handleSelectCitation} />}
              {activeTab === 'attention' && <AttentionTab onSelectClausePage={handleSelectCitation} />}
              {activeTab === 'chat' && <ChatTab onSelectCitation={handleSelectCitation} />}
              {activeTab === 'checklist' && <ChecklistTab />}
              {activeTab === 'lawyer' && <LawyerPrepTab />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
