"use client";

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';
import { LegalAnalysisData } from '@/app/workspace/[id]/page';

interface ChecklistTabProps {
  analysis?: LegalAnalysisData | null;
  isReady?: boolean;
}

interface Item {
  id: string;
  category: string;
  priority: string;
  text: string;
  reason?: string;
  completed: boolean;
}

export function ChecklistTab({ analysis, isReady }: ChecklistTabProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (isReady && analysis?.action_items && analysis.action_items.length > 0) {
      setItems(
        analysis.action_items.map((ai, idx) => ({
          id: `ai-${idx}`,
          category: ai.category || 'ACTION',
          priority: ai.priority || 'MEDIUM',
          text: ai.task || 'Action item',
          reason: ai.reason || undefined,
          completed: false,
        }))
      );
    } else {
      setItems([]);
    }
  }, [analysis, isReady]);

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
        {items.length > 0 && (
          <span className="text-xs text-slate-400 font-mono">
            {items.filter((i) => i.completed).length} / {items.length} Completed
          </span>
        )}
      </div>

      <div className="space-y-3">
        {!isReady ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <CheckSquare className="w-6 h-6 text-brand-400 mx-auto" />
            <p className="text-xs text-slate-300">Pending Analysis...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No actionable items were found in this document.</p>
          </div>
        ) : (
          items.map((item) => (
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    item.priority === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.priority} Priority
                  </span>
                </div>
                <p className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {item.text}
                </p>
                {item.reason && (
                  <p className="text-[11px] text-slate-400 font-mono">Reason: {item.reason}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
