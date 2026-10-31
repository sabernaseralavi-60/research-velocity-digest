import React, { useState } from 'react';
import { TrendingPaper, PipelineStats } from '../types/index.ts';
import { renderEmailDigestHtml } from '../services/emailRenderer.ts';
import { X, Copy, Check, Download, Send, Smartphone, Monitor, CheckCircle } from 'lucide-react';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  papers: TrendingPaper[];
  stats: PipelineStats;
  recipientEmail: string;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  papers,
  stats,
  recipientEmail,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [targetEmail, setTargetEmail] = useState(recipientEmail);
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const htmlContent = renderEmailDigestHtml(papers, stats, targetEmail);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-velocity-digest-${stats.endDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm text-white">Email Digest Preview</span>
            <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
              HTML Template
            </span>
          </div>

          {/* Viewport Toggles & Actions */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-1.5 rounded-md text-xs flex items-center space-x-1 ${
                  deviceView === 'desktop'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View (680px container)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-1.5 rounded-md text-xs flex items-center space-x-1 ${
                  deviceView === 'mobile'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (380px container)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              onClick={handleCopyHtml}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied HTML' : 'Copy HTML'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
              title="Download HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dispatch Simulator Bar */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <form onSubmit={handleSendTest} className="flex items-center space-x-2 flex-1 max-w-md">
            <span className="text-slate-400 text-xs shrink-0 font-medium">To:</span>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs flex-1 focus:outline-none focus:border-blue-500 font-mono"
              placeholder="user@example.com"
              required
            />
            <button
              type="submit"
              className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>Simulate Dispatch</span>
            </button>
          </form>

          {testSent && (
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium text-xs animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>Digest email payload rendered successfully for {targetEmail}!</span>
            </div>
          )}

          <div className="text-slate-500 text-[11px] font-mono">
            {papers.length} Papers &bull; &ge;{stats.trendingThreshold} refs
          </div>
        </div>

        {/* Rendered HTML Container */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-6 flex justify-center">
          <div
            className={`transition-all duration-300 w-full shadow-2xl rounded-xl overflow-hidden ${
              deviceView === 'desktop' ? 'max-w-[700px]' : 'max-w-[390px]'
            }`}
          >
            <iframe
              title="Email Digest Preview"
              srcDoc={htmlContent}
              className="w-full h-full min-h-[700px] border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
