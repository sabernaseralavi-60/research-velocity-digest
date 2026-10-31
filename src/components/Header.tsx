import React from 'react';
import { Sparkles, Terminal, Mail, HelpCircle, Flame } from 'lucide-react';

interface HeaderProps {
  onOpenEmailPreview: () => void;
  onOpenCodeExplorer: () => void;
  onOpenSetupGuide: () => void;
  activeTab: 'dashboard' | 'explainer' | 'code' | 'email';
  setActiveTab: (tab: 'dashboard' | 'explainer' | 'code' | 'email') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenEmailPreview,
  onOpenCodeExplorer,
  onOpenSetupGuide,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white whitespace-nowrap">
                  <span className="inline sm:hidden">AI Velocity</span>
                  <span className="hidden sm:inline">AI Research Velocity</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Inverted Index
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                Surging AI/ML papers with Google Scholar citation links
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Live Pipeline
            </button>
            <button
              onClick={() => setActiveTab('explainer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'explainer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Algorithm Architecture
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Python &amp; Workflows
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={onOpenEmailPreview}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
              title="Preview rendered HTML email digest"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Email Preview</span>
            </button>

            <button
              onClick={onOpenCodeExplorer}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
              title="View production Python code"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Source Code</span>
            </button>

            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-md shadow-blue-600/20"
              title="Gmail and GitHub Actions setup guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Setup Guide</span>
              <span className="inline sm:hidden">Setup</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
