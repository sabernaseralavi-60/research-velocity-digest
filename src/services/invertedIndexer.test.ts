import test from 'node:test';
import assert from 'node:assert/strict';
import { generateScholarUrl, reconstructAbstract } from '../utils/scholar.ts';
import {
  buildInvertedReferenceIndex,
  compileTrendingPapers,
  calculatePipelineStats,
} from './invertedIndexer.ts';
import { RawPaper } from '../types/index.ts';

test('generateScholarUrl creates sanitized query with exact phrase wrapping', () => {
  const url = generateScholarUrl('Attention Is All You Need', 'Vaswani', 2017);
  assert.ok(url.startsWith('https://scholar.google.com/scholar'));
  assert.ok(url.includes('q=%22Attention+Is+All+You+Need%22') || url.includes('Attention+Is+All+You+Need'));
  assert.ok(url.includes('as_ylo=2017'));
});

test('generateScholarUrl cleans special characters and trailing dots', () => {
  const url = generateScholarUrl('Deep Residual Learning for Image Recognition...', 'He', 2016);
  assert.ok(!url.includes('...'));
  assert.ok(url.includes('Deep+Residual+Learning'));
});

test('reconstructAbstract reassembles inverted index into ordered text', () => {
  const invertedIndex = {
    Transformer: [0],
    models: [1],
    achieve: [2],
    state: [3],
    of: [4],
    the: [5],
    art: [6],
    performance: [7],
  };

  const text = reconstructAbstract(invertedIndex);
  assert.equal(text, 'Transformer models achieve state of the art performance');
});

test('buildInvertedReferenceIndex accurately aggregates reference frequencies', () => {
  // Simulate 3 recent papers with citation links
  const recentPapers: RawPaper[] = [
    {
      id: 'https://openalex.org/W_RECENT_1',
      title: 'New Diffusion Architecture',
      publication_date: '2026-10-25',
      publication_year: 2026,
      referenced_works: [
        'https://openalex.org/W_ATTENTION',
        'https://openalex.org/W_DIFFUSION_DDPM',
        'https://openalex.org/W_ADAM',
      ],
    },
    {
      id: 'https://openalex.org/W_RECENT_2',
      title: 'Scaling Vision Transformers',
      publication_date: '2026-10-26',
      publication_year: 2026,
      referenced_works: [
        'https://openalex.org/W_ATTENTION',
        'https://openalex.org/W_VIT',
        'https://openalex.org/W_ADAM',
      ],
    },
    {
      id: 'https://openalex.org/W_RECENT_3',
      title: 'Multimodal Soft Computing',
      publication_date: '2026-10-27',
      publication_year: 2026,
      referenced_works: [
        'https://openalex.org/W_ATTENTION',
        'https://openalex.org/W_CLIP',
        'https://openalex.org/W_ADAM',
        'https://openalex.org/W_ATTENTION', // duplicate in same paper should not count twice
      ],
    },
  ];

  const index = buildInvertedReferenceIndex(recentPapers, 2);

  // W_ATTENTION cited in all 3 papers -> count = 3
  assert.equal(index.referenceCounts.get('https://openalex.org/W_ATTENTION'), 3);
  // W_ADAM cited in all 3 papers -> count = 3
  assert.equal(index.referenceCounts.get('https://openalex.org/W_ADAM'), 3);
  // W_DIFFUSION_DDPM cited in 1 paper -> count = 1
  assert.equal(index.referenceCounts.get('https://openalex.org/W_DIFFUSION_DDPM'), 1);

  // Filtered list with threshold 2 should contain W_ATTENTION and W_ADAM
  assert.equal(index.filteredWorkIds.length, 2);
  assert.ok(index.filteredWorkIds.includes('https://openalex.org/W_ATTENTION'));
  assert.ok(index.filteredWorkIds.includes('https://openalex.org/W_ADAM'));
});

test('compileTrendingPapers builds enriched trending items with ranking', () => {
  const refCounts = new Map<string, number>([
    ['W1', 14],
    ['W2', 8],
  ]);

  const citingMap = new Map<string, Array<{ id: string; title: string }>>([
    ['W1', [{ id: 'R1', title: 'Paper A' }]],
    ['W2', [{ id: 'R2', title: 'Paper B' }]],
  ]);

  const mockHydrated: RawPaper[] = [
    {
      id: 'W1',
      title: 'LoRA: Low-Rank Adaptation of Large Language Models',
      publication_date: '2021-10-16',
      publication_year: 2021,
      cited_by_count: 5200,
      authorships: [{ author: { id: 'A1', display_name: 'Edward Hu' } }],
      referenced_works: [],
      primary_topic: {
        id: 'T1',
        display_name: 'Language Models & Fine-Tuning',
        subfield: { display_name: 'Machine Learning' },
      },
    },
    {
      id: 'W2',
      title: 'Segment Anything',
      publication_date: '2023-04-05',
      publication_year: 2023,
      cited_by_count: 3100,
      authorships: [{ author: { id: 'A2', display_name: 'Alexander Kirillov' } }],
      referenced_works: [],
      primary_topic: {
        id: 'T2',
        display_name: 'Image Segmentation',
        subfield: { display_name: 'Computer Vision' },
      },
    },
  ];

  const trending = compileTrendingPapers(mockHydrated, refCounts, citingMap, 10);
  assert.equal(trending.length, 2);
  assert.equal(trending[0].id, 'W1');
  assert.equal(trending[0].recent_citation_velocity, 14);
  assert.ok(trending[0].scholar_url.includes('scholar.google.com'));
  assert.equal(trending[1].id, 'W2');
  assert.equal(trending[1].recent_citation_velocity, 8);
});

test('calculatePipelineStats generates accurate metadata', () => {
  const stats = calculatePipelineStats(120, 4800, 3100, 15, 7, 10, Date.now() - 500);
  assert.equal(stats.lookbackDays, 7);
  assert.equal(stats.recentPapersScanned, 120);
  assert.equal(stats.totalReferencesExtracted, 4800);
  assert.equal(stats.uniqueWorksCited, 3100);
  assert.equal(stats.trendingThreshold, 10);
  assert.equal(stats.trendingFoundCount, 15);
  assert.ok(stats.executionTimeMs >= 0);
});
