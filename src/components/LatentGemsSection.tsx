import React, { useState } from 'react';
import { LatentGemPaper } from '../types/index.ts';
import { Compass, Lightbulb, ArrowUpRight, Clock, Quote, Check, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface LatentGemsSectionProps {
  gems: LatentGemPaper[];
  activeKeywords: string[];
}

export const LatentGemsSection: React.FC<LatentGemsSectionProps> = ({ gems, activeKeywords }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyBibtex = (paper: LatentGemPaper) => {
    const key = (paper.authors[0]?.split(' ').pop() || 'Gem') + paper.publication_year;
    const bibtex = `@article{${key.toLowerCase()},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.publication_year}},
  note={Un-awakened Latent Gem Discovery},
  url={${paper.scholar_url}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (gems.length === 0) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-amber-950/30 via-slate-900 to-emerald-950/20 border border-amber-600/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-amber-800/30 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20">
            <Lightbulb className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Undiscovered Sleeping Beauties (Pre-Awakening Opportunities)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                Zero Citations &bull; High Latent Value
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Historical works with near-zero citations that mathematically match today&apos;s unsolved research frontiers in your selected labels
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/60">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{gems.length} Dormant Blue-Ocean Works</span>
        </div>
      </div>

      {/* Grid of Latent Gem Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {gems.map((gem) => {
          const isCopied = copiedId === gem.id;

          return (
            <div
              key={gem.id}
              className="bg-slate-950/80 border border-amber-900/30 hover:border-amber-500/50 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Latent Potential: {gem.latent_potential_score}</span>
                  </span>

                  <span className="bg-slate-800/80 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Dormant for {gem.dormancy_years} Years ({gem.publication_year})</span>
                  </span>

                  <span className="bg-rose-500/10 text-rose-300 text-[11px] font-bold px-2 py-0.5 rounded border border-rose-500/30">
                    Only {gem.all_time_citations} historical citations!
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors leading-snug mb-1">
                  {gem.title}
                </h4>

                {/* Authors */}
                <p className="text-xs text-slate-400 mb-2">
                  By {gem.authors.join(', ')}
                </p>

                {/* Why valuable badge */}
                <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-lg mb-2.5">
                  <strong className="text-emerald-400">Researcher Advantage: </strong>
                  {gem.why_valuable}
                </div>

                {/* Abstract or snippet */}
                {gem.abstract && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border-l-2 border-amber-500/80 mb-3 line-clamp-2">
                    {gem.abstract}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                <div className="text-[11px] text-amber-400/90 font-mono">
                  Concept: <span className="text-white font-medium">{gem.semantic_overlap_concept}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyBibtex(gem)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs flex items-center space-x-1"
                    title="Copy BibTeX"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Quote className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={gem.scholar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-600/30"
                  >
                    <span>Awaken on Scholar</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
