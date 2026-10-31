import React from 'react';
import { PipelineStats } from '../types/index.ts';
import { FileText, Link2, Compass, Zap, Clock, Award } from 'lucide-react';

interface PipelineMetricsBarProps {
  stats: PipelineStats;
}

export const PipelineMetricsBar: React.FC<PipelineMetricsBarProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Metric 1 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-white font-mono">{stats.recentPapersScanned}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">New Papers</div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-white font-mono">{stats.totalReferencesExtracted}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Ref Links</div>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-white font-mono">{stats.uniqueWorksCited}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Unique Cited</div>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-emerald-400 font-mono">&ge; {stats.trendingThreshold}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Velocity Cutoff</div>
        </div>
      </div>

      {/* Metric 5 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-rose-400 font-mono">{stats.trendingFoundCount}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Surging Found</div>
        </div>
      </div>

      {/* Metric 6 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-base font-extrabold text-slate-200 font-mono">{stats.executionTimeMs}ms</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Pipeline Time</div>
        </div>
      </div>
    </div>
  );
};
