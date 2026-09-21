/**
 * Google Lighthouse Core Web Vitals & Cumulative Layout Shift (CLS) Auditor Tool
 */

import { LighthouseVitalsAudit } from '../types.js';
import { parseHtml } from '../utils/html-parser.js';

export interface LighthouseAuditInput {
  url?: string;
  html?: string;
  strategy?: 'mobile' | 'desktop';
  apiKey?: string;
}

export function auditLocalClsHeuristics(html: string): LighthouseVitalsAudit {
  const doc = parseHtml(html);
  const risks: string[] = [];
  const culprits: Array<{ element?: string; nodeSnippet?: string; shiftScore?: number }> = [];

  let estimatedShift = 0.0;

  // Check 1: Images without explicit width/height
  const unsizedImages = doc.images.filter((img) => !img.width || !img.height);
  if (unsizedImages.length > 0) {
    const shiftContribution = Math.min(0.25, unsizedImages.length * 0.05);
    estimatedShift += shiftContribution;
    risks.push(`${unsizedImages.length} image(s) missing width & height attributes. When images load asynchronously, content reflow causes severe CLS.`);
    for (const img of unsizedImages.slice(0, 5)) {
      culprits.push({
        element: 'img',
        nodeSnippet: `<img src="${img.src}" alt="${img.alt || ''}">`,
        shiftScore: 0.05,
      });
    }
  }

  // Check 2: Unsized iframes
  const iframeRegex = /<iframe\b([^>]*?)>/gi;
  let iframeMatch: RegExpExecArray | null;
  let unsizedIframes = 0;
  while ((iframeMatch = iframeRegex.exec(html)) !== null) {
    const attrs = iframeMatch[1];
    if (!/width\s*=/i.test(attrs) || !/height\s*=/i.test(attrs)) {
      unsizedIframes++;
      estimatedShift += 0.08;
      culprits.push({
        element: 'iframe',
        nodeSnippet: iframeMatch[0],
        shiftScore: 0.08,
      });
    }
  }
  if (unsizedIframes > 0) {
    risks.push(`${unsizedIframes} <iframe> element(s) missing reserved width/height dimensions.`);
  }

  // Check 3: Web fonts without font-display: swap / optional
  const fontFaceRegex = /@font-face\s*\{([^}]*)\}/gi;
  let fontMatch: RegExpExecArray | null;
  let missingFontDisplay = 0;
  while ((fontMatch = fontFaceRegex.exec(html)) !== null) {
    if (!/font-display\s*:\s*(swap|optional|fallback)/i.test(fontMatch[1])) {
      missingFontDisplay++;
      estimatedShift += 0.03;
    }
  }
  if (missingFontDisplay > 0) {
    risks.push(`${missingFontDisplay} @font-face declaration(s) missing 'font-display: swap'. FOIT/FOUT can trigger text layout shifts.`);
  }

  // Check 4: Top banner / dynamic announcement without min-height
  const topBannerMatch = /<(div|header|section)[^>]*(banner|announcement|alert|notification|top-bar)[^>]*>/i.exec(html);
  if (topBannerMatch && !/min-height|height/i.test(topBannerMatch[0])) {
    estimatedShift += 0.04;
    risks.push('Top announcement banner detected without fixed min-height reserve slot.');
  }

  const clsScore = Number(Math.min(0.6, estimatedShift).toFixed(3));
  let rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' = 'GOOD';
  if (clsScore > 0.25) rating = 'POOR';
  else if (clsScore > 0.1) rating = 'NEEDS_IMPROVEMENT';

  const recommendations: string[] = [];
  if (unsizedImages.length > 0) {
    recommendations.push('Always include width and height attributes on <img> and <video> tags, or reserve aspect ratio with CSS `aspect-ratio: 16/9`.');
  }
  if (unsizedIframes > 0) {
    recommendations.push('Reserve container aspect ratio for all embedded iframes, YouTube players, and social widgets.');
  }
  if (missingFontDisplay > 0) {
    recommendations.push('Add `font-display: swap` or `font-display: optional` to custom web fonts to prevent FOIT (Flash of Invisible Text) layout shifts.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Layout stability is well structured. Ensure dynamic ads or async AJAX widgets have pre-allocated placeholder dimensions.');
  }

  return {
    source: 'local_heuristic',
    coreWebVitals: {
      cls: {
        score: clsScore,
        rating,
        description: `Estimated Cumulative Layout Shift based on DOM & CSS heuristics: ${clsScore} (${rating}). Google threshold: <= 0.1 is Good.`,
        culprits,
      },
      lcp: { valueMs: null, formatted: 'N/A (Requires live browser test)', rating: 'N/A' },
      inp: { valueMs: null, formatted: 'N/A (Requires live user interaction)', rating: 'N/A' },
      fcp: { valueMs: null, formatted: 'N/A (Requires live browser test)', rating: 'N/A' },
      ttfb: { valueMs: null, formatted: 'N/A (Requires network test)', rating: 'N/A' },
    },
    clsHeuristicRisks: risks,
    recommendations,
  };
}

export async function auditLighthouseVitals(input: LighthouseAuditInput): Promise<LighthouseVitalsAudit> {
  const strategy = input.strategy || 'mobile';

  if (!input.url) {
    if (input.html) {
      return auditLocalClsHeuristics(input.html);
    }
    throw new Error('Either a live "url" or "html" content must be provided.');
  }

  const url = input.url;

  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('strategy', strategy);
    apiUrl.searchParams.append('category', 'performance');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');
    if (input.apiKey) {
      apiUrl.searchParams.set('key', input.apiKey);
    }

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`PageSpeed API returned status ${response.status}: ${errText}`);
      // Fallback to fetching page HTML and computing local heuristics
      const pageRes = await fetch(url);
      const html = await pageRes.text();
      const heuristic = auditLocalClsHeuristics(html);
      heuristic.url = url;
      heuristic.recommendations.unshift(`Note: Google PageSpeed API returned ${response.status}. Displaying DOM-based layout shift heuristics.`);
      return heuristic;
    }

    const data: any = await response.json();
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse?.audits || {};
    const categories = lighthouse?.categories || {};

    // 1. CLS
    const clsAudit = audits['cumulative-layout-shift'] || {};
    const clsScore = Number((clsAudit.numericValue ?? 0).toFixed(3));
    let clsRating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' = 'GOOD';
    if (clsScore > 0.25) clsRating = 'POOR';
    else if (clsScore > 0.1) clsRating = 'NEEDS_IMPROVEMENT';

    // Layout shift culprit items
    const layoutShiftAudit = audits['layout-shift-elements'] || {};
    const culprits: Array<{ element?: string; nodeSnippet?: string; shiftScore?: number }> = [];
    if (Array.isArray(layoutShiftAudit.details?.items)) {
      for (const item of layoutShiftAudit.details.items) {
        culprits.push({
          element: item.node?.nodeLabel,
          nodeSnippet: item.node?.snippet,
          shiftScore: item.score ? Number(item.score.toFixed(3)) : undefined,
        });
      }
    }

    // 2. LCP
    const lcpAudit = audits['largest-contentful-paint'] || {};
    const lcpMs = lcpAudit.numericValue ? Math.round(lcpAudit.numericValue) : null;
    let lcpRating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A' = 'N/A';
    if (lcpMs !== null) {
      if (lcpMs <= 2500) lcpRating = 'GOOD';
      else if (lcpMs <= 4000) lcpRating = 'NEEDS_IMPROVEMENT';
      else lcpRating = 'POOR';
    }

    // 3. INP / TBT / FID
    const tbtAudit = audits['total-blocking-time'] || audits['interactive'] || {};
    const tbtMs = tbtAudit.numericValue ? Math.round(tbtAudit.numericValue) : null;
    let inpRating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A' = 'N/A';
    if (tbtMs !== null) {
      if (tbtMs <= 200) inpRating = 'GOOD';
      else if (tbtMs <= 500) inpRating = 'NEEDS_IMPROVEMENT';
      else inpRating = 'POOR';
    }

    // 4. FCP
    const fcpAudit = audits['first-contentful-paint'] || {};
    const fcpMs = fcpAudit.numericValue ? Math.round(fcpAudit.numericValue) : null;
    let fcpRating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A' = 'N/A';
    if (fcpMs !== null) {
      if (fcpMs <= 1800) fcpRating = 'GOOD';
      else if (fcpMs <= 3000) fcpRating = 'NEEDS_IMPROVEMENT';
      else fcpRating = 'POOR';
    }

    // 5. TTFB
    const ttfbAudit = audits['server-response-time'] || {};
    const ttfbMs = ttfbAudit.numericValue ? Math.round(ttfbAudit.numericValue) : null;
    let ttfbRating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A' = 'N/A';
    if (ttfbMs !== null) {
      if (ttfbMs <= 800) ttfbRating = 'GOOD';
      else if (ttfbMs <= 1800) ttfbRating = 'NEEDS_IMPROVEMENT';
      else ttfbRating = 'POOR';
    }

    // Category scores (0 - 100)
    const perfScore = categories.performance?.score != null ? Math.round(categories.performance.score * 100) : null;
    const seoScore = categories.seo?.score != null ? Math.round(categories.seo.score * 100) : null;
    const a11yScore = categories.accessibility?.score != null ? Math.round(categories.accessibility.score * 100) : null;
    const bpScore = categories['best-practices']?.score != null ? Math.round(categories['best-practices'].score * 100) : null;

    const recommendations: string[] = [];
    if (clsScore > 0.1) {
      recommendations.push(`CLS is ${clsScore} (${clsRating}). Fix layout shifts by specifying dimensions on media and reserving space for dynamically injected content.`);
    }
    if (lcpRating === 'POOR' || lcpRating === 'NEEDS_IMPROVEMENT') {
      recommendations.push(`LCP is ${lcpMs}ms (${lcpRating}). Preload hero images, optimize web font loading, and compress hero assets.`);
    }
    if (ttfbRating === 'POOR' || ttfbRating === 'NEEDS_IMPROVEMENT') {
      recommendations.push(`TTFB is ${ttfbMs}ms. Utilize edge caching, CDN, or server-side response caching.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Core Web Vitals meet Google Lighthouse "Good" thresholds.');
    }

    return {
      source: 'google_lighthouse_api',
      url,
      fetchTime: lighthouse.fetchTime,
      device: strategy,
      categories: {
        performance: perfScore,
        seo: seoScore,
        accessibility: a11yScore,
        bestPractices: bpScore,
      },
      coreWebVitals: {
        cls: {
          score: clsScore,
          rating: clsRating,
          description: `Cumulative Layout Shift: ${clsScore} (${clsRating}). Target: <= 0.1`,
          culprits,
        },
        lcp: {
          valueMs: lcpMs,
          formatted: lcpMs !== null ? `${(lcpMs / 1000).toFixed(2)}s` : 'N/A',
          rating: lcpRating,
        },
        inp: {
          valueMs: tbtMs,
          formatted: tbtMs !== null ? `${tbtMs}ms (TBT proxy)` : 'N/A',
          rating: inpRating,
        },
        fcp: {
          valueMs: fcpMs,
          formatted: fcpMs !== null ? `${(fcpMs / 1000).toFixed(2)}s` : 'N/A',
          rating: fcpRating,
        },
        ttfb: {
          valueMs: ttfbMs,
          formatted: ttfbMs !== null ? `${ttfbMs}ms` : 'N/A',
          rating: ttfbRating,
        },
      },
      recommendations,
    };
  } catch (error: any) {
    // If network or PageSpeed fails, compute local heuristics
    try {
      const res = await fetch(url);
      const html = await res.text();
      const heuristic = auditLocalClsHeuristics(html);
      heuristic.url = url;
      heuristic.recommendations.unshift(`Note: Direct PageSpeed API fetch failed (${error.message}). Evaluated DOM layout shift heuristics.`);
      return heuristic;
    } catch {
      throw new Error(`Failed to audit Lighthouse vitals for ${url}: ${error.message}`);
    }
  }
}
