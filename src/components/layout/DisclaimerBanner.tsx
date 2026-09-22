"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-xs text-slate-400 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold text-slate-300">Responsible AI Notice:</strong> LegalLens provides educational assistance and document navigation. It does not provide legal advice or replace a qualified legal professional.
        </span>
      </div>
    </div>
  );
}
