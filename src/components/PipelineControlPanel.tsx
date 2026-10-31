import React from 'react';
import { Play, Sliders, Calendar, Zap, Mail, Layers, Globe2, RefreshCw } from 'lucide-react';

interface PipelineControlPanelProps {
  lookbackDays: number;
  setLookbackDays: (days: number) => void;
  minVelocity: number;
  setMinVelocity: (val: number) => void;
  topN: number;
  setTopN: (val: number) => void;
  selectedSubfields: string[];
  toggleSubfield: (field: string) => void;
  customKeywords: string[];
  onAddCustomKeyword: (kw: string) => void;
  onRemoveCustomKeyword: (kw: string) => void;
  politeEmail: string;
  setPoliteEmail: (email: string) => void;
  useLiveNetwork: boolean;
  setUseLiveNetwork: (use: boolean) => void;
  isRunning: boolean;
  onRunPipeline: () => void;
}

const PRESET_TOPICS = [
  'Surrogate Safety Measures',
  'Household Travel Survey',
  'Traffic Conflict Technique',
  'Autonomous Vehicle Trajectory',
  'Transportation Network Reliability',
  'Artificial Intelligence',
  'Machine Learning',
  'Soft Computing',
];

export const PipelineControlPanel: React.FC<PipelineControlPanelProps> = ({
  lookbackDays,
  setLookbackDays,
  minVelocity,
  setMinVelocity,
  topN,
  setTopN,
  selectedSubfields,
  toggleSubfield,
  customKeywords,
  onAddCustomKeyword,
  onRemoveCustomKeyword,
  politeEmail,
  setPoliteEmail,
  useLiveNetwork,
  setUseLiveNetwork,
  isRunning,
  onRunPipeline,
}) => {
  const [newKeywordInput, setNewKeywordInput] = React.useState('');

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeywordInput.trim()) {
      onAddCustomKeyword(newKeywordInput.trim());
      setNewKeywordInput('');
    }
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Pipeline Control Center</h3>
            <p className="text-xs text-slate-400">
              Configure inverted citation thresholds, subfield filters, and ingestion windows
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className={`inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all ${
              isRunning
                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 active:scale-95'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Indexing Works...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Run Inverted Index</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
        {/* Lookback Window */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1 font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Lookback Window</span>
            </span>
            <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[11px]">
              {lookbackDays} Days
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            step="1"
            value={lookbackDays}
            onChange={(e) => setLookbackDays(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>3d (Fast)</span>
            <span>7d (Standard)</span>
            <span>30d (Monthly)</span>
          </div>
        </div>

        {/* Velocity Threshold */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1 font-semibold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Min Citation Velocity</span>
            </span>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
              &ge; {minVelocity} refs
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={minVelocity}
            onChange={(e) => setMinVelocity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>1 (Broad)</span>
            <span>5 (Trending)</span>
            <span>15 (Breakthrough)</span>
          </div>
        </div>

        {/* Top N Papers */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1 font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Digest Size</span>
            </span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">
              {topN} Papers
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>5</span>
            <span>15 (Default)</span>
            <span>25</span>
          </div>
        </div>

        {/* Data Source & Polite Pool */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center space-x-1 font-semibold text-slate-300">
              <Globe2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Data Ingestion Mode</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUseLiveNetwork(false)}
              className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-all ${
                !useLiveNetwork
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Benchmark (Instant)
            </button>
            <button
              onClick={() => setUseLiveNetwork(true)}
              className={`flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-all ${
                useLiveNetwork
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Live OpenAlex API
            </button>
          </div>
        </div>
      </div>

      {/* Google Scholar Labels & Custom Research Keywords */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-slate-300 font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Active Research Labels &amp; Google Scholar Interests:</span>
          </div>

          <form onSubmit={handleAddKeyword} className="flex items-center space-x-1.5">
            <input
              type="text"
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              placeholder="Add Scholar Label (e.g. Surrogate Safety, Travel Survey)..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
            <button
              type="submit"
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              + Add
            </button>
          </form>
        </div>

        {/* Selected Custom Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {customKeywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center space-x-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 px-2.5 py-1 rounded-lg text-xs font-semibold"
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => onRemoveCustomKeyword(kw)}
                className="text-blue-400 hover:text-white font-bold ml-1"
                title="Remove keyword"
              >
                &times;
              </button>
            </span>
          ))}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">
            Quick Add Presets:
          </span>
          {PRESET_TOPICS.map((preset) => {
            const isAdded = customKeywords.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => isAdded ? onRemoveCustomKeyword(preset) : onAddCustomKeyword(preset)}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-all border ${
                  isAdded
                    ? 'bg-slate-800 text-blue-300 border-blue-500/30'
                    : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
                }`}
              >
                {isAdded ? '✓ ' : '+ '}{preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
