"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileCheck
} from 'lucide-react';

export interface DocumentPageData {
  page_number: number;
  text: string;
  section_info?: string | null;
}

export interface DocumentContentData {
  document_id: string;
  title: string;
  file_type: string;
  page_count: number;
  pages: DocumentPageData[];
}

interface DocumentViewerProps {
  document?: DocumentContentData | null;
  highlightedSection?: string | null;
}

export function DocumentViewer({ document, highlightedSection }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  // Reset to page 1 whenever a new document is loaded
  useEffect(() => {
    setCurrentPage(1);
  }, [document?.document_id]);

  const totalPages = document?.page_count || 1;
  const activePageData = document?.pages?.[currentPage - 1];

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Document Control Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="font-medium text-slate-200 truncate max-w-[200px]" title={document?.title || "Document Viewer"}>
            {document?.title ? `${document.title}.${document.file_type}` : "Document Canvas"}
          </span>
        </div>

        {/* Page Navigator */}
        <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 hover:text-white disabled:opacity-40 transition-opacity"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 hover:text-white disabled:opacity-40 transition-opacity"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(75, z - 15))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 w-9 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(150, z + 15))} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas with Extracted Text */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex justify-center items-start">
        <div 
          className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 space-y-6 text-xs leading-relaxed transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Header of sheet */}
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center text-[10px] font-sans text-slate-500 uppercase tracking-wider">
            <span className="truncate max-w-[280px]">{document?.title || "LEGAL DOCUMENT"}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
              {document?.file_type ? document.file_type.toUpperCase() : "RAW TEXT"}
            </span>
          </div>

          {/* Section Info Banner if present */}
          {activePageData?.section_info && (
            <div className="px-3 py-1.5 rounded bg-brand-50 border border-brand-200 text-brand-900 font-semibold text-[11px] font-sans">
              {activePageData.section_info}
            </div>
          )}

          {/* Extracted Page Body */}
          <div className="space-y-4 font-sans text-slate-800 text-[12px] whitespace-pre-wrap leading-relaxed min-h-[350px]">
            {activePageData?.text ? (
              activePageData.text
            ) : (
              <div className="text-slate-400 italic text-center py-12">
                No extracted text available for Page {currentPage}.
              </div>
            )}
          </div>

          {/* Page Footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] font-sans text-slate-400">
            <span>Page {currentPage} of {totalPages}</span>
            <span className="flex items-center gap-1 text-slate-500">
              <FileCheck className="w-3 h-3 text-emerald-600" /> Grounded Text Layer
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
