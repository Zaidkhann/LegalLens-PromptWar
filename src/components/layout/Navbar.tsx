"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, FileText, GitCompare, LayoutDashboard, Upload, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload & Analyze', href: '/upload', icon: Upload },
    { name: 'Compare Documents', href: '/compare', icon: GitCompare },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                LegalLens
                <span className="text-[10px] font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.5 rounded-full">
                  Hackathon Edition
                </span>
              </span>
              <span className="text-[10px] text-slate-400 -mt-1 font-medium">Document Intelligence Navigator</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-800/90 text-white border border-slate-700/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/workspace/demo"
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              Demo Workspace
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-glow transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-brand-200" />
              Analyze Document
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  active
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5 text-brand-400" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              href="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Document
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
