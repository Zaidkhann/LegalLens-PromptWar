"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield, 
  FileText, 
  Search, 
  AlertTriangle, 
  CheckSquare, 
  UserCheck, 
  GitCompare, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Lock, 
  HelpCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-brand-300 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            GenAI Legal Intelligence Navigator
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]"
          >
            Understand your legal documents.{' '}
            <span className="bg-gradient-to-r from-brand-300 via-indigo-300 to-brand-400 bg-clip-text text-transparent">
              Before you sign, know what you&apos;re reading.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            LegalLens transforms complicated rental contracts, employment agreements, policies, and service terms into clear plain-language insights, grounded Q&A, and actionable lawyer preparation.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/upload"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl shadow-glow text-base transition-all active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-brand-200" />
              Analyze a Document
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold px-7 py-3.5 rounded-xl text-base transition-all"
            >
              See How It Works
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </motion.div>

          {/* Key Product Values Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand-400" /> Grounded Source Citations</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand-400" /> Plain-Language Conversion</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-brand-400" /> Lawyer Preparation Briefs</span>
          </div>
        </div>

        {/* Hero Interactive Document Demo Mockup */}
        <div className="max-w-5xl mx-auto mt-14 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-slate-300">Residential_Lease_Agreement_2026.pdf</span>
            </div>
            <span className="bg-brand-500/10 text-brand-300 px-2.5 py-1 rounded border border-brand-500/20 font-medium">
              Interactive Intelligence Layer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Raw Legal Clause */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>RAW CONTRACT EXCERPT</span>
                <span className="text-slate-500">Page 4, Sec 8.2</span>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
                &quot;The Lessee agrees that in the event of early termination prior to the 24-month term expiration, Lessee shall forfeit the entirety of the Security Deposit ($4,800) and remain liable for 60 days of liquidated damages...&quot;
              </p>
            </div>

            {/* LegalLens Intelligence Layer */}
            <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> LEGALLENS PLAIN EXPLANATION
                </span>
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-medium">
                  High Attention Point
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                <strong>What this means:</strong> If you move out before 24 months, you will lose your entire $4,800 deposit and owe an additional 2 months of rent as a penalty.
              </p>
              <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="text-amber-400 font-semibold">Suggested Action:</span> Ask the landlord if early termination can be reduced to 30 days notice with a 1-month penalty instead.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW LEGALLENS WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-slate-800/60">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Process Workflow</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">How LegalLens Works</p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From raw legal document to structured understanding in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Upload Document',
              description: 'Drop your rental agreement, employment contract, service agreement, or policy in PDF, DOCX, or TXT format.',
              icon: FileText,
            },
            {
              step: '02',
              title: 'Plain-Language Breakdown',
              description: 'LegalLens extracts key clauses, parties, commitments, dates, and financial terms into plain, everyday language.',
              icon: BookOpen,
            },
            {
              step: '03',
              title: 'Attention & Risk Signals',
              description: 'Identifies non-standard obligations, penalty clauses, or ambiguous language that deserves closer review.',
              icon: AlertTriangle,
            },
            {
              step: '04',
              title: 'Action & Lawyer Prep',
              description: 'Generates actionable next steps, deadlines, and a structured briefing sheet for speaking with legal counsel.',
              icon: UserCheck,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 transition-all space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-mono font-bold text-slate-700">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CORE PRODUCT CAPABILITIES GRID */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-slate-800/60">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-semibold tracking-widest text-brand-400 uppercase">Core Capabilities</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">An Interactive Legal Understanding System</p>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Not just a generic document summary. A deep, grounded legal navigation layer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Understand Documents</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convert legal jargon into simple explanations detailing party responsibilities, payments, termination rules, and key dates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Find Important Clauses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-categorize clauses into Termination, Liability, Penalties, Confidentiality, Non-Compete, and Dispute Resolution.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Attention & Risk Signals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Highlight restrictive terms or unusual clauses with cautious, objective language advising what you may want to clarify.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">4. Grounded &quot;Ask Your Doc&quot;</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask natural language questions. Every answer is grounded directly in the text with exact page and section citations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">5. Compare Contract Versions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload two versions of an agreement to see added, removed, or modified clauses with plain-language impact explanations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">6. Prepare for a Lawyer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a structured meeting brief containing specific questions to ask, clauses to review, and documents to bring.
            </p>
          </div>
        </div>
      </section>

      {/* RESPONSIBLE AI COMMITMENT SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center space-y-6">
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Our Responsible AI Principles</h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mx-auto">
            LegalLens provides informational assistance and education to help ordinary readers navigate complex legal documents. LegalLens does NOT provide formal legal advice, express definitive legal opinions, or replace a licensed attorney.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strict Grounding</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Page-Level Citations</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cautious Language</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 bg-gradient-to-r from-slate-900 via-brand-950/20 to-slate-900 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to understand your contract?</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Upload your document now and get instant plain-language breakdown, clause extraction, and actionable insights.
          </p>
          <div>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-xl shadow-glow text-base transition-all active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-brand-200" />
              Analyze Your Document Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
