"use client";

import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ExternalLink, 
  HelpCircle,
  ShieldCheck,
  CornerDownRight
} from 'lucide-react';

interface ChatTabProps {
  onSelectCitation?: (page: number, sectionId: string) => void;
}

export function ChatTab({ onSelectCitation }: ChatTabProps) {
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'ai';
    text: string;
    citation?: { page: number; section: string };
  }>>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your LegalLens document assistant. You can ask any question about this Residential Lease Agreement, such as termination penalties, rent payment grace periods, or repair obligations.',
    },
    {
      id: '2',
      sender: 'user',
      text: 'When can this agreement be terminated and what is the penalty?',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'According to Section 8.2 of the agreement, you may terminate early; however, doing so results in forfeiture of your full $4,800 security deposit plus 60 days of liquidated damages. If you intend not to renew at the end of the 2-year term, you must provide written notice 90 days prior to expiration (Section 8.1).',
      citation: { page: 4, section: '8.2' },
    },
  ]);

  const [input, setInput] = useState('');

  const suggestedQuestions = [
    'How much do I have to pay for security deposit?',
    'What happens if I pay rent late?',
    'Is subletting allowed?',
    'Who pays for routine repair expenses?',
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = { id: Date.now().toString(), sender: 'user' as const, text };
    const aiPlaceholder = {
      id: (Date.now() + 1).toString(),
      sender: 'ai' as const,
      text: 'Grounded AI reasoning simulated placeholder: The rental agreement states in Section 3.1 that rent is due on the 1st of each month with a 5-day grace period ending on the 5th.',
      citation: { page: 2, section: '3.1' },
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-white">Ask Your Document</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Grounded in Page Citations
        </span>
      </div>

      {/* Suggested Questions Pills */}
      <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Suggested:</span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] whitespace-nowrap transition-colors border border-slate-700/60"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-indigo-600 text-white shadow-glow'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[80%] space-y-2 p-3.5 rounded-2xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white rounded-tr-none'
                : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
            }`}>
              <p>{msg.text}</p>

              {/* Source Page Citation Chip */}
              {msg.citation && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-brand-400" />
                    Source Grounding:
                  </span>
                  <button
                    onClick={() => onSelectCitation && onSelectCitation(msg.citation!.page, msg.citation!.section)}
                    className="flex items-center gap-1 text-[11px] text-brand-300 font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30 hover:border-brand-500/60 transition-colors"
                  >
                    <span>Page {msg.citation.page}, Sec {msg.citation.section}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask a question about this contract..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
