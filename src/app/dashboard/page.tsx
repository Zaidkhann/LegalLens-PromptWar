"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  GitCompare, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Filter, 
  Search,
  FileCheck2,
  Inbox
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'empty'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample placeholder document list
  const sampleDocuments = [
    {
      id: 'demo-doc-1',
      title: 'Residential Rental Agreement 2026.pdf',
      type: 'Rental Lease Agreement',
      date: 'Sep 22, 2026',
      size: '2.4 MB',
      status: 'Analyzed',
      clausesCount: 8,
      attentionCount: 2,
      pageCount: 6,
    },
    {
      id: 'demo-doc-2',
      title: 'Software Engineering Employment Contract.pdf',
      type: 'Employment Agreement',
      date: 'Sep 18, 2026',
      size: '1.8 MB',
      status: 'Analyzed',
      clausesCount: 12,
      attentionCount: 1,
      pageCount: 10,
    },
    {
      id: 'demo-doc-3',
      title: 'SaaS Master Service Terms & Conditions.docx',
      type: 'Service Terms',
      date: 'Sep 15, 2026',
      size: '950 KB',
      status: 'Analyzed',
      clausesCount: 15,
      attentionCount: 3,
      pageCount: 14,
    },
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Document Workspace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your legal documents, review plain-language insights, and prepare for legal discussions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/compare"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-200 text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            <GitCompare className="w-4 h-4 text-brand-400" />
            Compare Docs
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-glow text-sm transition-all"
          >
            <Plus className="w-4 h-4 text-brand-200" />
            Analyze New Document
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/upload"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">Analyze a Document</h3>
            <p className="text-xs text-slate-400">Upload PDF, DOCX, or TXT for plain-language breakdown.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-brand-400 transition-colors" />
        </Link>

        <Link
          href="/compare"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Compare Contracts</h3>
            <p className="text-xs text-slate-400">Upload two contract versions to review added or modified terms.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </Link>

        <Link
          href="/workspace/demo-doc-1"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 transition-all group flex items-start justify-between"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Ask Your Document</h3>
            <p className="text-xs text-slate-400">Natural-language grounded Q&A with exact section citations.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>

      {/* RECENT DOCUMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Documents ({sampleDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('empty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'empty'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Test Empty State
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
            />
          </div>
        </div>

        {/* DOCUMENTS LIST OR EMPTY STATE */}
        {activeTab === 'empty' ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No documents uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first contract or agreement to unlock LegalLens plain-language intelligence and citation Q&A.
              </p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-lg"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sampleDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white hover:text-brand-300 transition-colors">
                        <Link href={`/workspace/${doc.id}`}>{doc.title}</Link>
                      </h4>
                      <span className="text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                        {doc.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Uploaded {doc.date}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.pageCount} pages</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-500/10 text-brand-300 border border-brand-500/20 px-2.5 py-1 rounded border font-medium">
                      {doc.clausesCount} Clauses
                    </span>
                    {doc.attentionCount > 0 && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded border font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {doc.attentionCount} Attention Points
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/workspace/${doc.id}`}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors"
                  >
                    Open Workspace
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
