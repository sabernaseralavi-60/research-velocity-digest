import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { PipelineMetricsBar } from './components/PipelineMetricsBar.tsx';
import { PipelineControlPanel, DataSource } from './components/PipelineControlPanel.tsx';
import { LiveDatabasePanel } from './components/LiveDatabasePanel.tsx';
import {
  DbDigest,
  DbStatus,
  DbTopic,
  digestToStats,
  fetchDbDigest,
  fetchDbStatus,
  fetchDbTopics,
} from './services/dbApi.ts';
import { TrendingPapersTable } from './components/TrendingPapersTable.tsx';
import { AlgorithmExplainer } from './components/AlgorithmExplainer.tsx';
import { CodeExplorer } from './components/CodeExplorer.tsx';
import { EmailPreviewModal } from './components/EmailPreviewModal.tsx';
import { SetupGuideModal } from './components/SetupGuideModal.tsx';
import { SleepingBeautySection } from './components/SleepingBeautySection.tsx';
import { LatentGemsSection } from './components/LatentGemsSection.tsx';
import { TrendingPaper, SleepingBeautyPaper, LatentGemPaper, PipelineStats, RawPaper } from './types/index.ts';
import { fetchRecentPapersOpenAlex, hydrateWorksOpenAlex, getAllCandidateHydratedWorks } from './services/openAlexService.ts';
import { renderEmailDigestHtml } from './services/emailRenderer.ts';
import {
  buildInvertedReferenceIndex,
  compileTrendingPapers,
  detectSleepingBeauties,
  screenLatentGems,
  calculatePipelineStats,
} from './services/invertedIndexer.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explainer' | 'code' | 'email'>('dashboard');
  const [lookbackDays, setLookbackDays] = useState(7);
  const [minVelocity, setMinVelocity] = useState(3);
  const [topN, setTopN] = useState(15);
  const [selectedSubfields, setSelectedSubfields] = useState<string[]>([
    'Artificial Intelligence',
    'Machine Learning',
    'Computer Vision',
    'Deep Learning',
    'Soft Computing',
  ]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([
    'Surrogate Safety Measures',
    'Household Travel Survey',
    'Traffic Conflict',
  ]);
  const [politeEmail, setPoliteEmail] = useState('');
  // 'db' = the daily citation database (real data), 'live' = OpenAlex right now, 'demo' = synthetic fixture
  const [source, setSource] = useState<DataSource>('db');
  const useLiveNetwork = source === 'live';
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [dbTopics, setDbTopics] = useState<DbTopic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [dbWindow, setDbWindow] = useState(7);
  const [dbDigest, setDbDigest] = useState<DbDigest | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const loadDbMeta = useCallback(async () => {
    try {
      const [status, topics] = await Promise.all([fetchDbStatus(), fetchDbTopics()]);
      setDbStatus(status);
      setDbTopics(topics);
      setTopicId((cur) => (cur && topics.some((t) => t.topic_id === cur) ? cur : topics[0]?.topic_id || ''));
      setDbReady(topics.length > 0);
      if (topics.length === 0) setSource((s) => (s === 'db' ? 'demo' : s));
    } catch (err) {
      setDbReady(false);
      setDbError(`Database not available: ${err instanceof Error ? err.message : String(err)}`);
      setSource((s) => (s === 'db' ? 'demo' : s));
    }
  }, []);

  useEffect(() => {
    void loadDbMeta();
  }, [loadDbMeta]);

  const [trendingPapers, setTrendingPapers] = useState<TrendingPaper[]>([]);
  const [sleepingBeauties, setSleepingBeauties] = useState<SleepingBeautyPaper[]>([]);
  const [latentGems, setLatentGems] = useState<LatentGemPaper[]>([]);
  const [stats, setStats] = useState<PipelineStats>({
    lookbackDays: 7,
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    recentPapersScanned: 0,
    totalReferencesExtracted: 0,
    uniqueWorksCited: 0,
    trendingThreshold: 3,
    trendingFoundCount: 0,
    executionTimeMs: 0,
  });

  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  const toggleSubfield = (subfield: string) => {
    setSelectedSubfields((prev) =>
      prev.includes(subfield) ? prev.filter((s) => s !== subfield) : [...prev, subfield]
    );
  };

  const handleAddCustomKeyword = (kw: string) => {
    if (!customKeywords.includes(kw)) {
      setCustomKeywords((prev) => [...prev, kw]);
    }
  };

  const handleRemoveCustomKeyword = (kw: string) => {
    setCustomKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const executePipeline = useCallback(async () => {
    setIsRunning(true);
    setRunError(null);
    const startTime = Date.now();

    try {
      if (source === 'db') {
        if (!topicId) return;
        setDbError(null);
        try {
          const digest = await fetchDbDigest(topicId, dbWindow);
          setDbDigest(digest);
          setTrendingPapers(digest.trending);
          setSleepingBeauties(digest.sleeping_beauties);
          setLatentGems(digest.latent_gems);
          setStats(digestToStats(digest));
        } catch (err) {
          setDbDigest(null);
          setTrendingPapers([]);
          setSleepingBeauties([]);
          setLatentGems([]);
          setDbError(err instanceof Error ? err.message : String(err));
        }
        return;
      }

      // Step 1: Ingest newly published papers in the recent window
      const recentPapers = await fetchRecentPapersOpenAlex(lookbackDays, politeEmail, useLiveNetwork);

      // Filter by selected subfields or user custom keywords if matched
      const filteredRecent = recentPapers.filter((p) => {
        if (!p.primary_topic) return true;
        const topicName = p.primary_topic.display_name.toLowerCase();
        const subfieldName = (p.primary_topic.subfield?.display_name || '').toLowerCase();
        const titleAndAbstract = ((p.title || '') + ' ' + (p.abstract || '')).toLowerCase();

        const matchSubfield = selectedSubfields.some(
          (sf) => topicName.includes(sf.toLowerCase()) || subfieldName.includes(sf.toLowerCase())
        );
        const matchKeyword = customKeywords.some((kw) => titleAndAbstract.includes(kw.toLowerCase()));
        return matchSubfield || matchKeyword;
      });

      const papersToProcess = filteredRecent.length > 0 ? filteredRecent : recentPapers;

      // Step 2: Build Inverted Reference Index (extract referenced_works -> frequency count)
      const indexResult = buildInvertedReferenceIndex(papersToProcess, minVelocity);

      // If threshold was very high and returned none, fallback to top available
      let candidateIds = indexResult.filteredWorkIds;
      if (candidateIds.length === 0 && indexResult.referenceCounts.size > 0) {
        candidateIds = Array.from(indexResult.referenceCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, topN)
          .map(([id]) => id);
      }

      // Step 3: Hydrate metadata for candidate trending papers AND sleeping beauty candidates (>=2 citations)
      const allActiveCitedIds = Array.from(indexResult.referenceCounts.entries())
        .filter(([_, count]) => count >= 2)
        .map(([id]) => id);
      const combinedTargetIds = Array.from(new Set([...candidateIds.slice(0, topN), ...allActiveCitedIds]));

      const hydratedRecords = await hydrateWorksOpenAlex(combinedTargetIds, politeEmail, useLiveNetwork);

      // Step 4: Compile trending papers with exact-quote Scholar links & velocity metrics
      const compiled = compileTrendingPapers(
        hydratedRecords,
        indexResult.referenceCounts,
        indexResult.citingMap,
        topN
      );

      // Step 5: Detect Sleeping Beauties (Dormant works awakened by this recent batch)
      const detectedSleepingBeauties = detectSleepingBeauties(
        hydratedRecords,
        indexResult.referenceCounts,
        indexResult.citingMap,
        3
      );

      // Step 6: Screen for Un-awakened Latent Gems matching user custom Scholar labels
      // The only historical catalogue available in the browser is the synthetic fixture, so live mode
      // must not screen it: real latent gems come from the daily database, never from invented papers.
      const detectedLatentGems = useLiveNetwork
        ? []
        : screenLatentGems(getAllCandidateHydratedWorks(), customKeywords);

      // Step 7: Compute pipeline statistics
      const computedStats = calculatePipelineStats(
        papersToProcess.length,
        indexResult.totalReferencesCount,
        indexResult.referenceCounts.size,
        compiled.length,
        lookbackDays,
        minVelocity,
        startTime
      );

      setTrendingPapers(compiled);
      setSleepingBeauties(detectedSleepingBeauties);
      setLatentGems(detectedLatentGems);
      setStats(computedStats);
    } catch (err) {
      console.error('Pipeline execution error:', err);
      setRunError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  }, [lookbackDays, minVelocity, topN, selectedSubfields, customKeywords, politeEmail, source, useLiveNetwork, topicId, dbWindow]);

  // Execute pipeline once on initial mount
  useEffect(() => {
    executePipeline();
  }, [executePipeline]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Header
        onOpenEmailPreview={() => setIsEmailPreviewOpen(true)}
        onOpenCodeExplorer={() => setActiveTab('code')}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab 1: Live Pipeline Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {source === 'demo' && (
              <div role="status" className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                Demo data: the papers below are a synthetic fixture for demonstration, not findings.
                {dbError ? ` ${dbError}.` : ' Switch to "Database (daily)" or "OpenAlex now" for real papers.'}
              </div>
            )}
            {runError && (
              <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                Live run failed: {runError}. No data was substituted.
              </div>
            )}
            {source === 'live' && !runError && (
              <div role="status" className="mb-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-300">
                Live from OpenAlex: about 50 of the newest papers, one request. Latent gems and a growing history need the daily database.
              </div>
            )}
            {source === 'db' && dbStatus && (
              <LiveDatabasePanel
                status={dbStatus}
                topics={dbTopics}
                topicId={topicId}
                setTopicId={setTopicId}
                windowDays={dbWindow}
                setWindowDays={setDbWindow}
                digest={dbDigest}
                digestError={dbError}
                onTopicsChanged={() => void loadDbMeta()}
              />
            )}
            {/* Top Metrics Cards */}
            <PipelineMetricsBar stats={stats} />

            {/* Pipeline Control Center */}
            <PipelineControlPanel
              lookbackDays={lookbackDays}
              setLookbackDays={setLookbackDays}
              minVelocity={minVelocity}
              setMinVelocity={setMinVelocity}
              topN={topN}
              setTopN={setTopN}
              selectedSubfields={selectedSubfields}
              toggleSubfield={toggleSubfield}
              customKeywords={customKeywords}
              onAddCustomKeyword={handleAddCustomKeyword}
              onRemoveCustomKeyword={handleRemoveCustomKeyword}
              politeEmail={politeEmail}
              setPoliteEmail={setPoliteEmail}
              source={source}
              setSource={setSource}
              dbAvailable={dbReady}
              isRunning={isRunning}
              onRunPipeline={executePipeline}
            />

            {/* Un-awakened Latent Sleeping Beauties / Dormant Gems Discovery */}
            <LatentGemsSection gems={latentGems} activeKeywords={customKeywords} />
            {source === 'db' && dbDigest && latentGems.length === 0 && (
              <p className="mb-6 text-xs text-slate-500">
                No latent-gem candidates for this topic and window yet (they need older, rarely cited works that recent papers cite; the 30-day window searches deepest).
              </p>
            )}

            {/* Sleeping Beauties Resurgence Section */}
            <SleepingBeautySection papers={sleepingBeauties} />

            {/* Trending Papers Table / Cards */}
            <TrendingPapersTable
              papers={trendingPapers}
              onOpenEmailPreview={() => setIsEmailPreviewOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Algorithm Architecture & Explainer */}
        {activeTab === 'explainer' && <AlgorithmExplainer />}

        {/* Tab 3: Python Codebase & Workflow Explorer */}
        {activeTab === 'code' && <CodeExplorer />}

        {/* Tab 4: Email Preview embedded tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Email Digest Preview</h3>
              <button
                onClick={() => setIsEmailPreviewOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Open Fullscreen Preview Modal
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex justify-center">
              <iframe
                title="Email Digest Preview"
                srcDoc={renderEmailDigestHtml(trendingPapers, stats, politeEmail)}
                className="w-full max-w-[700px] min-h-[750px] rounded-lg shadow-xl bg-white"
              />
            </div>
          </div>
        )}
      </main>

      {/* Email Digest Preview Modal */}
      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={() => setIsEmailPreviewOpen(false)}
        papers={trendingPapers}
        stats={stats}
        recipientEmail={politeEmail}
      />

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />
    </div>
  );
}
