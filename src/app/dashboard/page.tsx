"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Upload, 
  GitCompare, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Search,
  Inbox,
  Loader2
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface StoredDocument {
  id: string;
  original_filename: string;
  title: string;
  file_type: string;
  file_size: number;
  page_count: number;
  processing_status: string;
  analysis_status?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data.documents || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard documents:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return 'Recently';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    (doc.title || doc.original_filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const askDocumentHref = documents.length > 0 ? `/workspace/${documents[0].id}` : '/upload';

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
          href={askDocumentHref}
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
            <span className="text-sm font-bold text-white">
              All Uploaded Documents ({documents.length})
            </span>
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
        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
            <p className="text-xs text-slate-400">Loading uploaded documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
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
              className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-lg hover:bg-brand-500 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDocuments.map((doc) => (
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
                        <Link href={`/workspace/${doc.id}`}>{doc.title || doc.original_filename}</Link>
                      </h4>
                      <span className="text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full uppercase font-mono">
                        {doc.file_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Uploaded {formatDate(doc.created_at)}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded border uppercase font-mono ${
                    doc.analysis_status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : doc.analysis_status === 'analyzing'
                      ? 'bg-brand-500/10 text-brand-300 border-brand-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {doc.analysis_status === 'completed' ? 'AI Analyzed' : doc.analysis_status === 'analyzing' ? 'Analyzing...' : 'Extracted'}
                  </span>

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
