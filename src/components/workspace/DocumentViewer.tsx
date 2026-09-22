"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Maximize2,
  Bookmark,
  Sparkles
} from 'lucide-react';

interface DocumentViewerProps {
  highlightedSection?: string | null;
}

export function DocumentViewer({ highlightedSection }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(4);
  const totalPages = 8;
  const [zoom, setZoom] = useState(100);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Document Control Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          <span className="font-medium text-slate-200 truncate max-w-[180px]">
            Residential_Lease_Agreement_2026.pdf
          </span>
        </div>

        {/* Page Navigator */}
        <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-white disabled:opacity-40"
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

      {/* Main Canvas Placeholder */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex justify-center items-start">
        <div 
          className="w-full max-w-2xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 space-y-6 text-xs leading-relaxed font-serif transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Header of simulated PDF sheet */}
          <div className="border-b border-slate-200 pb-4 flex justify-between items-center text-[10px] font-sans text-slate-500">
            <span>RESIDENTIAL LEASE AGREEMENT</span>
            <span>SECTION VIII: TERMINATION & REMEDIES</span>
          </div>

          <div className="space-y-4 font-sans text-slate-800 text-[11px]">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">
              CLAUSE 8.1 - EXPIRATION AND RENEWAL
            </h3>
            <p>
              This Agreement shall automatically renew for successive terms of twelve (12) months unless either party provides written notice of intent not to renew no less than ninety (90) calendar days prior to the expiration of the current term.
            </p>

            {/* Highlighted section simulating interactive citation linking */}
            <div className={`p-3.5 rounded-lg border transition-all ${
              highlightedSection === '8.2' || !highlightedSection
                ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-md ring-2 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-amber-900 mb-1">
                <span>CLAUSE 8.2 - EARLY TERMINATION & PENALTIES</span>
                <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-mono">CITATED IN LEGALLENS</span>
              </div>
              <p className="font-serif text-[11px] leading-relaxed">
                &quot;Lessee agrees that in the event of early termination prior to the expiration of the term, Lessee shall forfeit the entirety of the Security Deposit ($4,800) and remain liable for 60 days of liquidated damages...&quot;
              </p>
            </div>

            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1 pt-2">
              CLAUSE 8.3 - MAINTENANCE & ALTERATIONS
            </h3>
            <p>
              The Lessee shall not make any structural alterations, paint, or install permanent fixtures without prior written consent from the Lessor. Minor maintenance expenses under $100 shall be the responsibility of the Lessee.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-between text-[10px] font-sans text-slate-400">
            <span>Page 4 of 8</span>
            <span>CONFIDENTIAL - EXECUTED COPY</span>
          </div>
        </div>
      </div>
    </div>
  );
}
