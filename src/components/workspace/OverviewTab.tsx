"use client";

import React from 'react';
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  BookOpen 
} from 'lucide-react';

export function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Document Header Card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="bg-brand-500/10 text-brand-300 border border-brand-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Residential Lease Agreement
          </span>
          <span className="text-xs text-slate-400 font-mono">8 Pages • Executed</span>
        </div>
        <h2 className="text-xl font-extrabold text-white">Residential Rental Lease Agreement (2026-2028)</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Standard residential lease agreement defining terms for occupancy, rent payments, maintenance rules, security deposit rules, and termination provisions.
        </p>
      </div>

      {/* Key Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Parties */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Users className="w-4 h-4 text-brand-400" />
            PARTIES INVOLVED
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-200"><strong>Lessor (Landlord):</strong> Apex Property Management LLC</p>
            <p className="text-slate-200"><strong>Lessee (Tenant):</strong> Zaid Khan</p>
          </div>
        </div>

        {/* Financial Commitments */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            FINANCIAL OBLIGATIONS
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-200"><strong>Monthly Rent:</strong> $2,400 / month (Due 1st of month)</p>
            <p className="text-slate-200"><strong>Security Deposit:</strong> $4,800 (Refundable upon conditions)</p>
          </div>
        </div>

        {/* Key Dates */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Calendar className="w-4 h-4 text-indigo-400" />
            IMPORTANT DATES
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-200"><strong>Lease Term:</strong> Nov 1, 2026 – Oct 31, 2028 (24 Months)</p>
            <p className="text-slate-200"><strong>Renewal Notice:</strong> 90 Days prior (Aug 2, 2028)</p>
          </div>
        </div>

        {/* Governing Jurisdiction */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <MapPin className="w-4 h-4 text-rose-400" />
            JURISDICTION
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-slate-200"><strong>Governing Law:</strong> State of Washington</p>
            <p className="text-slate-200"><strong>Dispute Venue:</strong> King County Superior Court</p>
          </div>
        </div>
      </div>

      {/* Executive Plain-Language Summary Box */}
      <div className="p-5 rounded-2xl bg-brand-950/20 border border-brand-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            Plain-Language Executive Summary
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Grounded AI Analysis</span>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <p>
            This is a 2-year fixed residential rental agreement requiring a monthly payment of $2,400 with a $4,800 security deposit.
          </p>
          <p>
            <strong>Major Commitments:</strong> You are responsible for utility payments (electricity, water, internet), routine internal repairs under $100, and adhering to strict quiet hours between 10 PM and 7 AM.
          </p>
          <p>
            <strong>Key Restrictions:</strong> No subletting without prior written consent, no pets over 25 lbs, and no structural modifications or wall painting.
          </p>
        </div>
      </div>
    </div>
  );
}
