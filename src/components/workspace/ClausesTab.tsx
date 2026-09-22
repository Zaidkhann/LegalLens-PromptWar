"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Filter, 
  Search,
  Shield,
  Clock,
  DollarSign,
  AlertOctagon,
  Lock,
  Ban,
  Gavel
} from 'lucide-react';

interface ClausesTabProps {
  onSelectClausePage?: (page: number, sectionId: string) => void;
}

export function ClausesTab({ onSelectClausePage }: ClausesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Termination',
    'Payment',
    'Renewal',
    'Liability',
    'Confidentiality',
    'Restrictions',
    'Dispute Resolution',
  ];

  const clauses = [
    {
      id: '8.2',
      category: 'Termination',
      title: 'Clause 8.2 - Early Termination & Penalties',
      page: 4,
      raw: 'Lessee agrees that in the event of early termination prior to expiration, Lessee shall forfeit the entirety of the Security Deposit ($4,800) and remain liable for 60 days of liquidated damages...',
      explanation: 'If you move out early before 24 months, you will lose your entire $4,800 security deposit and be required to pay 2 additional months of rent.',
      risk: 'High Attention',
    },
    {
      id: '3.1',
      category: 'Payment',
      title: 'Clause 3.1 - Late Fee Escalate Provision',
      page: 2,
      raw: 'Rent is due on the 1st of each month. A grace period is extended to the 5th. Payments received after 11:59 PM on the 5th incur a flat $150 late charge plus $25/day until settled in full...',
      explanation: 'Late fees start on the 6th of the month: a flat $150 penalty plus $25 per day for every day payment is delayed.',
      risk: 'Moderate',
    },
    {
      id: '8.1',
      category: 'Renewal',
      title: 'Clause 8.1 - Automatic Renewal & Notice Window',
      page: 4,
      raw: 'This Agreement shall automatically renew for successive terms of 12 months unless either party provides written notice of intent not to renew no less than 90 calendar days prior...',
      explanation: 'You must provide written notice 90 days before your 2-year lease ends if you plan to move out, otherwise the lease automatically renews for another full year.',
      risk: 'High Attention',
    },
    {
      id: '12.4',
      category: 'Liability',
      title: 'Clause 12.4 - Indemnification & Property Loss Waiver',
      page: 6,
      raw: 'Lessor shall not be liable for damage or loss to Lessee property caused by plumbing leaks, storm events, or building maintenance unless caused directly by gross negligence...',
      explanation: 'The landlord is not responsible for damage to your personal belongings caused by leaks or storms. You should maintain renter’s insurance.',
      risk: 'Standard',
    },
    {
      id: '14.1',
      category: 'Restrictions',
      title: 'Clause 14.1 - Subletting & Assignment Ban',
      page: 7,
      raw: 'Lessee shall not assign this agreement, nor sublet any portion of the premises, nor permit rooming occupancy without prior written approval from Lessor...',
      explanation: 'You cannot sublet your apartment or bring in long-term roommates without the landlord’s written permission.',
      risk: 'Standard',
    },
  ];

  const filteredClauses = clauses.filter((c) => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesQuery = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search extracted clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses Cards List */}
      <div className="space-y-4">
        {filteredClauses.map((clause) => (
          <div
            key={clause.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-[11px] font-semibold border border-slate-700">
                  {clause.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  clause.risk === 'High Attention'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : clause.risk === 'Moderate'
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}>
                  {clause.risk}
                </span>
              </div>

              {/* Source Page Citation Chip */}
              <button
                onClick={() => onSelectClausePage && onSelectClausePage(clause.page, clause.id)}
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:border-brand-500/40 transition-colors"
              >
                <span>Page {clause.page}, Sec {clause.id}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-white">{clause.title}</h4>

            {/* Plain Language Explanation */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">What does this mean for me?</span>
              <p className="text-xs text-slate-200 leading-relaxed">{clause.explanation}</p>
            </div>

            {/* Raw Contract Text */}
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
              &quot;{clause.raw}&quot;
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
