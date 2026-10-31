import React, { useState } from 'react';
import { TrendingPaper } from '../types/index.ts';
import { ExternalLink, BookOpen, Quote, ChevronDown, ChevronUp, Check, Flame } from 'lucide-react';

interface TrendingPapersTableProps {
  papers: TrendingPaper[];
  onOpenEmailPreview: () => void;
}

export const TrendingPapersTable: React.FC<TrendingPapersTableProps> = ({
  papers,
  onOpenEmailPreview,
}) => {
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
  const [copiedBibtexId, setCopiedBibtexId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedPaperId(expandedPaperId === id ? null : id);
  };

  const handleCopyBibtex = (paper: TrendingPaper) => {
    const key = (paper.authors[0]?.split(' ').pop() || 'Paper') + paper.publication_year;
    const bibtex = `@article{${key.toLowerCase()},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.publication_year}},
  journal={OpenAlex Archive},
  url={${paper.scholar_url}}
}`;

    navigator.clipboard.writeText(bibtex);
    setCopiedBibtexId(paper.id);
    setTimeout(() => setCopiedBibtexId(null), 2000);
  };

  const filteredPapers = papers.filter((paper) => {
    const q = searchTerm.toLowerCase();
    return (
      paper.title.toLowerCase().includes(q) ||
      paper.primary_topic.toLowerCase().includes(q) ||
      paper.authors.some((a) => a.toLowerCase().includes(q))
    );
  });

  if (papers.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Trending Papers Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
          No papers in the current lookback window met the minimum citation velocity threshold. Try lowering the threshold or widening the lookback days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Top Trending Papers ({filteredPapers.length})
            </h3>
          </div>
          <span className="text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
            Sorted by Citation Velocity
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search titles, authors, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredPapers.map((paper, index) => {
          const isExpanded = expandedPaperId === paper.id;
          const isCopied = copiedBibtexId === paper.id;

          return (
            <div
              key={paper.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all shadow-sm group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                {/* Left Info Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-slate-800 text-slate-300 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-700 font-mono">
                      #{index + 1}
                    </span>

                    {/* Surging Velocity Badge */}
                    <span className="inline-flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs px-2 py-0.5 rounded">
                      <span>⚡ +{paper.recent_citation_velocity} recent citations</span>
                    </span>

                    {/* Topic Badge */}
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded">
                      {paper.primary_topic}
                    </span>

                    <span className="text-slate-500 text-xs font-mono">
                      {paper.publication_year}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug mb-1.5">
                    {paper.title}
                  </h4>

                  {/* Authors */}
                  <p className="text-xs text-slate-400 mb-3">
                    By <span className="text-slate-300 font-medium">{paper.authors.join(', ')}</span>
                  </p>

                  {/* Abstract Preview */}
                  {paper.abstract && (
                    <div className="bg-slate-950/60 border-l-2 border-blue-500/80 rounded-r-lg p-2.5 text-xs text-slate-300 leading-relaxed mb-3">
                      <strong className="text-blue-300 font-semibold">Key Takeaway: </strong>
                      {paper.abstract}
                    </div>
                  )}

                  {/* Citing Papers Accordion */}
                  {paper.sample_citing_papers.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleExpand(paper.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-medium transition-colors"
                      >
                        <span>
                          Cited by {paper.sample_citing_papers.length} newly ingested paper(s) in this batch
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 pl-3 border-l border-slate-800 space-y-1 text-[11px] text-slate-400">
                          {paper.sample_citing_papers.map((sample, i) => (
                            <div key={i} className="truncate">
                              &bull; &ldquo;{sample.title}&rdquo;
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Action Column */}
                <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                  {/* Direct Google Scholar Button */}
                  <a
                    href={paper.scholar_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 active:scale-95"
                    title="Open exact query on Google Scholar"
                  >
                    <span>Google Scholar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* OpenAlex Link */}
                  <a
                    href={paper.openalex_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    <span>OpenAlex</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {/* BibTeX Button */}
                  <button
                    onClick={() => handleCopyBibtex(paper)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                    title="Copy BibTeX citation"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Quote className="w-3 h-3" />
                        <span>BibTeX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
