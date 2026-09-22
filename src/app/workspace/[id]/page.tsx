"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  BookOpen, 
  AlertTriangle, 
  MessageSquare, 
  CheckSquare, 
  UserCheck,
  ChevronLeft,
  Share2,
  Download
} from 'lucide-react';
import Link from 'next/link';

import { DocumentViewer } from '@/components/workspace/DocumentViewer';
import { OverviewTab } from '@/components/workspace/OverviewTab';
import { ClausesTab } from '@/components/workspace/ClausesTab';
import { AttentionTab } from '@/components/workspace/AttentionTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { ChecklistTab } from '@/components/workspace/ChecklistTab';
import { LawyerPrepTab } from '@/components/workspace/LawyerPrepTab';

export default function DocumentWorkspacePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'attention' | 'chat' | 'checklist' | 'lawyer'>('overview');
  const [highlightedSection, setHighlightedSection] = useState<string | null>('8.2');

  const handleSelectCitation = (page: number, sectionId: string) => {
    setHighlightedSection(sectionId);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Workspace Sub-Header */}
      <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Residential_Lease_Agreement_2026.pdf
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Analyzed
              </span>
            </div>
            <p className="text-xs text-slate-400">Residential Lease Agreement • 8 Pages • Uploaded Today</p>
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

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT PANEL: Document Canvas / Viewer (5 cols) */}
        <div className="lg:col-span-5 p-4 bg-slate-950/40 border-r border-slate-800 flex flex-col h-full overflow-hidden">
          <DocumentViewer highlightedSection={highlightedSection} />
        </div>

        {/* RIGHT PANEL: Intelligence Workspace (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex items-center gap-1 px-4 pt-3 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none shrink-0">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'clauses', label: 'Important Clauses', icon: FileText },
              { id: 'attention', label: 'Attention Signals', icon: AlertTriangle, badge: '3' },
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
                  {tab.badge && (
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  )}
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
    </div>
  );
}
