import { TrendingPaper, PipelineStats } from '../types/index.ts';

/**
 * Renders high-fidelity responsive HTML email matching the production Jinja2 template.
 */
export function renderEmailDigestHtml(
  papers: TrendingPaper[],
  stats: PipelineStats,
  recipientEmail: string = 'saber.naseralavi@gmail.com'
): string {
  const cardsHtml = papers
    .map((paper, index) => {
      const authorsStr = paper.authors.join(', ');
      const abstractHtml = paper.abstract
        ? `<div style="font-size:13px;color:#334155;background:#f8fafc;padding:12px;border-radius:6px;margin:12px 0;border-left:3px solid #3b82f6;line-height:1.5;">
            <strong style="color:#1e293b;">Key Takeaway:</strong> ${paper.abstract}
           </div>`
        : '';

      const doiButton = paper.doi_url
        ? `<a href="${paper.doi_url}" style="display:inline-block;background:#f1f5f9;color:#334155;text-decoration:none;font-size:12px;font-weight:600;padding:8px 14px;border-radius:6px;border:1px solid #cbd5e1;margin-left:8px;" target="_blank">Publisher DOI &nearr;</a>`
        : '';

      const citingSample = paper.sample_citing_papers.length > 0
        ? `<div style="font-size:11px;color:#64748b;margin-top:10px;font-style:italic;">
            Recently referenced in: &ldquo;${paper.sample_citing_papers[0].title}&rdquo;${
            paper.sample_citing_papers.length > 1
              ? ` and ${paper.sample_citing_papers.length - 1} other new paper(s)`
              : ''
          }
           </div>`
        : '';

      return `
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <div style="margin-bottom:10px;">
          <span style="background:#e2e8f0;color:#0f172a;font-weight:800;font-size:12px;padding:3px 9px;border-radius:4px;margin-right:6px;">#${index + 1}</span>
          <span style="background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-weight:700;font-size:12px;padding:3px 9px;border-radius:4px;margin-right:6px;">⚡ +${paper.recent_citation_velocity} new citations</span>
          <span style="background:#e0f2fe;color:#0369a1;font-size:11px;font-weight:600;padding:3px 9px;border-radius:4px;">${paper.primary_topic} (${paper.publication_year})</span>
        </div>
        <div style="font-size:17px;font-weight:700;color:#0f172a;margin:8px 0 6px 0;line-height:1.4;">${paper.title}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:10px;">By ${authorsStr}</div>
        ${abstractHtml}
        <div style="margin-top:14px;">
          <a href="${paper.scholar_url}" style="display:inline-block;background:#2563eb;color:#ffffff !important;text-decoration:none;font-size:12px;font-weight:700;padding:8px 16px;border-radius:6px;letter-spacing:0.02em;" target="_blank">Open in Google Scholar &rarr;</a>
          <a href="${paper.openalex_url}" style="display:inline-block;background:#f1f5f9;color:#334155 !important;text-decoration:none;font-size:12px;font-weight:600;padding:8px 14px;border-radius:6px;border:1px solid #cbd5e1;margin-left:8px;" target="_blank">OpenAlex Record</a>
          ${doiButton}
        </div>
        ${citingSample}
      </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Research Velocity Digest</title>
</head>
<body style="margin:0;padding:24px;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 28px;color:#ffffff;border-bottom:3px solid #3b82f6;">
      <span style="display:inline-block;background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.4);color:#93c5fd;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:9999px;margin-bottom:12px;">
        WEEKLY INVERTED CITATION DIGEST
      </span>
      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">
        AI Research Velocity Digest
      </h1>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
        Trending papers with spiking citations from newly published AI, Machine Learning, Computer Vision, and Soft Computing works (${stats.startDate} &ndash; ${stats.endDate}).
      </p>
    </div>

    <!-- Quick Stats Bar -->
    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-bottom:1px solid #e2e8f0;text-align:center;">
      <tr>
        <td style="padding:14px;border-right:1px solid #e2e8f0;width:25%;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${stats.recentPapersScanned}</div>
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;">New Papers</div>
        </td>
        <td style="padding:14px;border-right:1px solid #e2e8f0;width:25%;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${stats.totalReferencesExtracted}</div>
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;">References</div>
        </td>
        <td style="padding:14px;border-right:1px solid #e2e8f0;width:25%;">
          <div style="font-size:18px;font-weight:800;color:#0f172a;">${stats.uniqueWorksCited}</div>
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;">Cited Works</div>
        </td>
        <td style="padding:14px;width:25%;">
          <div style="font-size:18px;font-weight:800;color:#2563eb;">&ge; ${stats.trendingThreshold}</div>
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;">Velocity Cutoff</div>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#1e3a8a;margin-bottom:22px;line-height:1.5;">
        <strong>Algorithmic Inverted Index:</strong> These trending papers were identified not by scanning millions of past articles, but by analyzing the reference vectors of the newest peer-reviewed publications from the past ${stats.lookbackDays} days.
      </div>

      ${cardsHtml}
    </div>

    <!-- Footer -->
    <div style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 28px;text-align:center;font-size:12px;color:#94a3b8;line-height:1.6;">
      Delivered to <strong style="color:#64748b;">${recipientEmail}</strong> &bull; Generated in ${(stats.executionTimeMs / 1000).toFixed(2)}s<br>
      Automated pipeline running via GitHub Actions cron (<code style="font-family:monospace;background:#e2e8f0;padding:2px 4px;border-radius:4px;color:#334155;">0 9 * * 1</code>).
    </div>
  </div>
</body>
</html>`;
}
