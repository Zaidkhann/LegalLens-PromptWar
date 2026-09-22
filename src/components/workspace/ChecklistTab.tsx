"use client";

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  Filter 
} from 'lucide-react';

export function ChecklistTab() {
  const [items, setItems] = useState([
    {
      id: '1',
      category: 'Review',
      priority: 'High',
      text: 'Review early termination clause 8.2 with landlord before signing',
      completed: false,
    },
    {
      id: '2',
      category: 'Deadline',
      priority: 'High',
      text: 'Calendar reminder for 90-day non-renewal notice (August 2, 2028)',
      completed: true,
    },
    {
      id: '3',
      category: 'Clarification',
      priority: 'Medium',
      text: 'Clarify whether routine HVAC filter changes are tenant or landlord expense',
      completed: false,
    },
    {
      id: '4',
      category: 'Action',
      priority: 'Medium',
      text: 'Obtain proof of tenant renters insurance policy with $100k liability coverage',
      completed: false,
    },
    {
      id: '5',
      category: 'Review',
      priority: 'Low',
      text: 'Confirm move-in condition inspection checklist procedure',
      completed: true,
    },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-brand-400" />
            Actionable Next Steps
          </h3>
          <p className="text-xs text-slate-400">Track tasks, deadlines, and points requiring action or clarification.</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {items.filter((i) => i.completed).length} / {items.length} Completed
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              item.completed
                ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="mt-0.5 text-brand-400">
              {item.completed ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-500" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  item.priority === 'High'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                }`}>
                  {item.priority} Priority
                </span>
              </div>
              <p className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
