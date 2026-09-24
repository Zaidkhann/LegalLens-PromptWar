import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileCheck, HelpCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-400" />
              <span className="font-bold text-sm text-white tracking-tight">LegalLens</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Intelligent legal document navigation and analysis powered by GenAI. Helping ordinary people understand what they sign.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-sm">Product Features</h4>
            <ul className="space-y-2">
              <li><Link href="/upload" className="hover:text-slate-200">Plain-Language Summaries</Link></li>
              <li><Link href="/upload" className="hover:text-slate-200">Clause Intelligence</Link></li>
              <li><Link href="/upload" className="hover:text-slate-200">Attention Signals</Link></li>
              <li><Link href="/upload" className="hover:text-slate-200">Grounded Document Q&A</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-sm">Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/upload" className="hover:text-slate-200">Upload PDF / DOCX</Link></li>
              <li><Link href="/compare" className="hover:text-slate-200">Compare Contract Versions</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-200">Lawyer Prep Brief</Link></li>
              <li><Link href="/dashboard" className="hover:text-slate-200">Action Checklist</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3 text-sm">Responsible AI Commitment</h4>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                Educational Assistance
              </div>
              <p className="text-[11px] leading-normal">
                LegalLens assists with comprehension and navigation. Answers are grounded directly in your uploaded file.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 LegalLens • PromptWar GenAI Hackathon Project</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded Reasoning</span>
            <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-brand-400" /> Hackathon Demo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
