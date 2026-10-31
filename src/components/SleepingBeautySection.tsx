import React, { useState } from 'react';
import { SleepingBeautyPaper } from '../types/index.ts';
import { Sparkles, ExternalLink, Moon, Sun, ArrowUpRight, Clock, BookOpen, Quote, Check } from 'lucide-react';

interface SleepingBeautySectionProps {
  papers: SleepingBeautyPaper[];
}

export const SleepingBeautySection: React.FC<SleepingBeautySectionProps> = ({ papers }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyBibtex = (paper: SleepingBeautyPaper) => {
    const key = (paper.authors[0]?.split(' ').pop() || 'Paper') + paper.publication_year;
    const bibtex = `@article{${key.toLowerCase()},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.publication_year}},
  note={Sleeping Beauty Resurgence},
  url={${paper.scholar_url}}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (papers.length === 0) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-purple-800/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-purple-800/30 pb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Discovered Sleeping Beauties
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full">
                Dormant Paradigm Shifts
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Foundational or overlooked past works experiencing a sudden burst of new citations in this batch
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-lg border border-purple-800/60">
          <Moon className="w-3.5 h-3.5 text-purple-400" />
          <span>{papers.length} Slumbering Gems Awakening</span>
        </div>
      </div>

      {/* Grid of sleeping beauty cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {papers.map((paper) => {
          const isCopied = copiedId === paper.id;

          return (
            <div
              key={paper.id}
              className="bg-slate-950/70 border border-purple-900/40 hover:border-purple-600/60 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-purple-500/20 text-purple-200 border border-purple-500/40 text-[11px] font-extrabold px-2 py-0.5 rounded flex items-center space-x-1">
                    <Sun className="w-3 h-3 text-amber-300" />
                    <span>Awakening Score: {paper.awakening_score}</span>
                  </span>

                  <span className="bg-slate-800/80 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Dormant for {paper.dormancy_years} Years (Pub: {paper.publication_year})</span>
                  </span>

                  <span className="bg-amber-500/10 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    +{paper.recent_citations} recent citations
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-snug mb-1">
                  {paper.title}
                </h4>

                {/* Authors */}
                <p className="text-xs text-slate-400 mb-2">
                  By {paper.authors.join(', ')}
                </p>

                {/* Abstract or snippet */}
                {paper.abstract && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border-l-2 border-purple-500/80 mb-3 line-clamp-2">
                    {paper.abstract}
                  </p>
                )}

                {/* Citing preprints */}
                {paper.sample_awakening_citers.length > 0 && (
                  <div className="text-[11px] text-purple-300/80 font-mono italic mb-3">
                    Wake-up citation from: &ldquo;{paper.sample_awakening_citers[0].title}&rdquo;
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                <div className="text-[11px] text-slate-400 font-mono">
                  All-time citations: <span className="text-white font-bold">{paper.all_time_citations}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyBibtex(paper)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs flex items-center space-x-1"
                    title="Copy BibTeX"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Quote className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={paper.scholar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30"
                  >
                    <span>Google Scholar</span>
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
