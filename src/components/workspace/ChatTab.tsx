"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ExternalLink, 
  ShieldCheck,
  CornerDownRight,
  Loader2,
  AlertCircle,
  FileSearch,
  CheckCircle2,
  HelpCircle,
  Info
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface SourceCitation {
  page_number: number;
  section?: string | null;
  excerpt: string;
  relevance?: number | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  keyPoints?: string[];
  citations?: SourceCitation[];
  notFound?: boolean;
  error?: boolean;
  timestamp: string;
}

interface ChatTabProps {
  documentId?: string;
  onSelectCitation?: (page: number, sectionId: string) => void;
  analysisData?: any;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "What are my main obligations?",
  "What happens if I terminate the agreement?",
  "What deadlines should I know about?",
  "Which clauses should I clarify?",
  "Who is responsible for repairs or maintenance?"
];

export function ChatTab({ documentId, onSelectCitation, analysisData }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: 'Hello! I am your LegalLens grounded document assistant. Ask any question about this legal document and I will answer strictly using its text with exact page citations.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [messages.length]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Build suggested questions dynamically from document analysis if available
  const getSuggestedQuestions = (): string[] => {
    if (!analysisData) return DEFAULT_SUGGESTED_QUESTIONS;
    const suggestions: string[] = [];

    if (analysisData.overview?.important_obligations?.length) {
      suggestions.push("What are my main obligations?");
    }
    if (analysisData.attention_signals?.length) {
      suggestions.push("Which clauses should I clarify?");
    }
    if (analysisData.important_clauses?.length) {
      suggestions.push("What happens if I terminate the agreement?");
    }
    if (analysisData.important_dates?.length) {
      suggestions.push("What deadlines should I know about?");
    }

    if (suggestions.length < 4) {
      DEFAULT_SUGGESTED_QUESTIONS.forEach(q => {
        if (!suggestions.includes(q) && suggestions.length < 5) {
          suggestions.push(q);
        }
      });
    }

    return suggestions.slice(0, 5);
  };

  const handleSend = async (textToSend?: string) => {
    const questionText = (textToSend || input).trim();
    if (!questionText || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionText,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLoadingStage('Searching your document...');

    // Loading UX sequence simulation
    const stageTimer1 = setTimeout(() => setLoadingStage('Analyzing relevant clauses...'), 1200);
    const stageTimer2 = setTimeout(() => setLoadingStage('Generating grounded answer...'), 2600);

    try {
      if (!documentId) {
        throw new Error('No document loaded. Please upload a document to use Ask Your Document.');
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/documents/${documentId}/chat`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate answer from document.');
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.answer,
        keyPoints: data.key_points || [],
        citations: data.citations || [],
        notFound: data.not_found || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: err.message || 'An error occurred while answering your question. Please try again.',
        error: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setLoading(false);
      setLoadingStage('');
    }
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div className="flex flex-col h-[640px] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="font-bold text-white">Ask Your Document</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Grounded RAG with Page Citations
        </span>
      </div>

      {/* Suggested Questions Pills */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" /> Suggested:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-colors border border-slate-700/60 disabled:opacity-50"
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
                : msg.error
                ? 'bg-rose-600 text-white'
                : 'bg-indigo-600 text-white shadow-glow'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] space-y-2.5 p-4 rounded-2xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-brand-600 text-white rounded-tr-none'
                : msg.error
                ? 'bg-rose-950/40 text-rose-200 border border-rose-800/60 rounded-tl-none'
                : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none'
            }`}>
              {/* Not Found Callout if document doesn't contain answer */}
              {msg.notFound && (
                <div className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Information not explicitly found in this document.</span>
                </div>
              )}

              {/* Main Text */}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Key Points Bullet List */}
              {msg.keyPoints && msg.keyPoints.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Key Takeaways:</span>
                  <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-300">
                    {msg.keyPoints.map((kp, idx) => (
                      <li key={idx} className="leading-snug">{kp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source Page Citation Chips */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-brand-400" />
                    Verifiable Page Sources ({msg.citations.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cite, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg p-2 flex flex-col gap-1 max-w-full"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => onSelectCitation && onSelectCitation(cite.page_number, cite.section || '')}
                            className="flex items-center gap-1 text-[11px] text-brand-300 font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/30 hover:border-brand-500/60 hover:bg-brand-500/20 transition-all text-left"
                            title="Click to view page in canvas"
                          >
                            <span>Page {cite.page_number}{cite.section ? ` • ${cite.section}` : ''}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </button>
                        </div>
                        {cite.excerpt && (
                          <p className="text-[10px] text-slate-400 italic line-clamp-2 pl-1 border-l border-slate-700">
                            "{cite.excerpt}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[9px] text-slate-500 text-right pt-1 font-mono">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-glow">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-950 text-slate-300 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs space-y-2 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-white text-xs">{loadingStage || 'Processing question...'}</p>
                <p className="text-[10px] text-slate-400">Filtering context vectors strictly within this document</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
          placeholder="Ask a question about this legal document..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-glow flex items-center justify-center shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
