import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, Zap, Database, Search, Mail, Cpu, RefreshCw, Compass } from 'lucide-react';

export const AlgorithmExplainer: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-900/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Algorithmic Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            The Inverted Indexing Solution to Citation Tracking
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            Detecting trending research papers by scraping or polling millions of past publications leads to IP bans, rate limit exhaustion, and massive compute costs. Here is why our inverted reference indexing algorithm scales effortlessly with zero API friction.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Naive / Brute Force Approach */}
        <div className="bg-slate-900/70 border border-red-950/60 rounded-xl p-6 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-400 mb-4 font-bold text-sm uppercase tracking-wider">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>The Problem: Brute-Force Historical Polling</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Attempting to query or scrape past papers to check whether their citation counters ticked up.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold shrink-0">&times;</span>
                <span><strong>250,000,000+ cataloged papers:</strong> Checking historical works requires millions of requests.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold shrink-0">&times;</span>
                <span><strong>Aggressive Rate Limiting:</strong> Semantic Scholar & OpenAlex enforce strict quotas; scraping Scholar directly causes immediate CAPTCHA blocks.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold shrink-0">&times;</span>
                <span><strong>Stale Velocity:</strong> Total all-time citation count hides recent momentum (a 2015 paper with 100k citations looks the same as one gaining 50 citations this week).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-400 font-bold shrink-0">&times;</span>
                <span><strong>High Infrastructure Cost:</strong> Requires distributed scraping clusters and rotating proxies.</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-red-400/80 font-mono">
            Complexity: O(N_historical &times; Poll_Frequency) &asymp; Millions of HTTP calls
          </div>
        </div>

        {/* The Inverted Indexing Solution */}
        <div className="bg-slate-900/70 border border-emerald-950/60 rounded-xl p-6 relative flex flex-col justify-between ring-1 ring-emerald-500/20">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-4 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>The Solution: Inverted Reference Indexing</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Inspect <strong>ONLY</strong> newly published papers from the past 7 days, extract their bibliographies, and tally which works are being cited.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Bounded Scan Size:</strong> Only ~100 to 500 AI papers are published per week across subfields.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Zero-Cost &amp; Polite Pool:</strong> Completed in just 3&ndash;5 OpenAlex polite API calls (<code className="text-emerald-300">mailto:</code> header gives 10 req/s for free).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>True Citation Velocity:</strong> Detects immediate research spikes &amp; emerging foundations before all-time citation metrics catch up.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span><strong>Exact-Match Google Scholar Links:</strong> Generates direct query links (<code className="text-blue-300">scholar.google.com/scholar?q="Title"</code>) with zero scraping.</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400/80 font-mono">
            Complexity: O(N_recent &times; Avg_Refs) &asymp; 5 API requests &bull; &lt; 3 seconds
          </div>
        </div>
      </div>

      {/* Step-by-Step Interactive Pipeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8">
        <h3 className="text-base font-bold text-white mb-6 flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-blue-400" />
          <span>Pipeline Data Lifecycle: From OpenAlex to Inbox</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Step 1
                </span>
                <Database className="w-4 h-4 text-slate-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Window Ingestion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries OpenAlex for papers published in past 7 days across AI, Machine Learning, Computer Vision, and Soft Computing with <code className="text-blue-300">has_references:true</code>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              Output: ~150-300 raw works
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Step 2
                </span>
                <Cpu className="w-4 h-4 text-amber-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Inverted Indexing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Iterates through <code className="text-amber-300">referenced_works</code> of each paper and tallies frequencies in a hash table. Also tracks citing paper samples for context.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              F(work_id) &rarr; Citation Count
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Step 3
                </span>
                <Search className="w-4 h-4 text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Threshold &amp; Scholar</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filters for works with velocity &ge; threshold (e.g. 5+). Batches metadata hydration, reconstructs abstracts, and builds exact-match quotation Google Scholar URLs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              Top-K Ranked with URLs
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Step 4
                </span>
                <Mail className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Automated Dispatch</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renders a mobile-responsive HTML digest and dispatches via Gmail SMTP. Fully automated every Monday morning using zero-cost GitHub Actions cron.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
              GitHub Actions &bull; 0 9 * * 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
