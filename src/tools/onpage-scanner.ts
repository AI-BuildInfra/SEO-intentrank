/**
 * On-Page SEO Scanner Tool
 * Meta Title, Description, Open Graph, Twitter Cards, Canonical, Hreflang, Image Alt Tags & Layout Shift Dimensions
 */

import { ParsedHtmlDocument, parseHtml } from '../utils/html-parser.js';
import {
  MetaTagAudit,
  OpenGraphAudit,
  TwitterCardAudit,
  ImageAltAudit,
  ImageAltAuditItem,
} from '../types.js';

export interface OnPageScanInput {
  html?: string;
  url?: string;
}

export interface OnPageScanResult {
  url?: string;
  meta: MetaTagAudit;
  openGraph: OpenGraphAudit;
  twitter: TwitterCardAudit;
  images: ImageAltAudit;
  summary: {
    passedChecks: number;
    warnings: number;
    criticalIssues: number;
    score: number; // 0 - 100
  };
  recommendations: string[];
}

export function scanMetaTags(doc: ParsedHtmlDocument, baseUrl?: string): MetaTagAudit {
  // Title
  const titleRaw = doc.title;
  const titleLen = titleRaw ? titleRaw.length : 0;
  // Estimate pixel width: average proportional font ~9.5px per char for typical serif/sans-serif
  const pixelWidthEst = Math.round(titleLen * 9.5);

  let titleStatus: MetaTagAudit['title']['status'] = 'optimal';
  let titleRec: string | undefined;

  if (!titleRaw || titleLen === 0) {
    titleStatus = 'missing';
    titleRec = 'CRITICAL: Add a descriptive <title> tag (50-60 characters) with your primary human intent keyword.';
  } else if (titleLen < 30) {
    titleStatus = 'too_short';
    titleRec = 'Title is too short (<30 chars). Expand to 50-60 characters to maximize SERP CTR and context.';
  } else if (titleLen > 60 || pixelWidthEst > 580) {
    titleStatus = 'too_long';
    titleRec = 'Title is too long (>60 chars / ~580px) and will likely be truncated on Google desktop/mobile SERPs.';
  }

  // Description
  const descMeta = doc.metas.find((m) => m.name === 'description');
  const descRaw = descMeta?.content || null;
  const descLen = descRaw ? descRaw.length : 0;

  const ctaWords = ['discover', 'learn', 'explore', 'get', 'try', 'find', 'start', 'read', 'see', 'buy', 'order', 'download'];
  const hasCTA = descRaw ? ctaWords.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(descRaw)) : false;

  let descStatus: MetaTagAudit['description']['status'] = 'optimal';
  let descRec: string | undefined;

  if (!descRaw || descLen === 0) {
    descStatus = 'missing';
    descRec = 'CRITICAL: Add a <meta name="description"> tag (120-160 characters) summarizing page value with a clear CTA.';
  } else if (descLen < 70) {
    descStatus = 'too_short';
    descRec = 'Meta description is too short (<70 chars). Expand to 120-160 characters to improve snippet CTR.';
  } else if (descLen > 160) {
    descStatus = 'too_long';
    descRec = 'Meta description exceeds 160 characters and may be cut off in search snippets.';
  }

  // Robots
  const robotsMeta = doc.metas.find((m) => m.name === 'robots');
  const robotsRaw = robotsMeta?.content || null;
  const directives = robotsRaw ? robotsRaw.toLowerCase().split(/,\s*/).map((d) => d.trim()) : [];
  const isIndexable = !directives.includes('noindex');
  const isFollowable = !directives.includes('nofollow');

  // Canonical
  const canonicalLink = doc.links.find((l) => l.rel === 'canonical');
  const canonicalRaw = canonicalLink?.href || null;
  let canonicalStatus: MetaTagAudit['canonical']['status'] = 'valid';
  let canonicalRec: string | undefined;
  let isSelfReferencing: boolean | undefined;

  if (!canonicalRaw) {
    canonicalStatus = 'missing';
    canonicalRec = 'Add a self-referencing <link rel="canonical" href="..."> to prevent duplicate content consolidation issues.';
  } else if (!canonicalRaw.startsWith('http://') && !canonicalRaw.startsWith('https://')) {
    canonicalStatus = 'relative';
    canonicalRec = 'Canonical URL is relative. Use absolute URLs (https://example.com/page) for canonical tags.';
  } else if (baseUrl) {
    try {
      const canonicalUrlObj = new URL(canonicalRaw);
      const currentUrlObj = new URL(baseUrl);
      isSelfReferencing = canonicalUrlObj.origin === currentUrlObj.origin && canonicalUrlObj.pathname === currentUrlObj.pathname;
      if (!isSelfReferencing) {
        canonicalStatus = 'mismatched';
        canonicalRec = `Canonical points to a different URL (${canonicalRaw}). Ensure this is intentional cross-page canonicalization.`;
      }
    } catch {
      // ignore URL parsing error
    }
  }

  // Charset
  const charsetMeta = doc.metas.find((m) => m.charset || m.httpEquiv === 'content-type');
  const charset = charsetMeta?.charset || (charsetMeta?.content?.includes('charset=') ? charsetMeta.content.split('charset=')[1] : null) || null;

  // Viewport
  const viewportMeta = doc.metas.find((m) => m.name === 'viewport');
  const viewportRaw = viewportMeta?.content || null;
  const isMobileOptimized = !!(viewportRaw && viewportRaw.includes('width=device-width'));

  // Hreflang
  const hreflangs = doc.links
    .filter((l) => l.rel === 'alternate' && l.hreflang && l.href)
    .map((l) => ({ lang: l.hreflang!, href: l.href! }));

  return {
    title: {
      raw: titleRaw,
      length: titleLen,
      pixelWidthEstimate: pixelWidthEst,
      status: titleStatus,
      recommendation: titleRec,
    },
    description: {
      raw: descRaw,
      length: descLen,
      status: descStatus,
      hasCallToAction: hasCTA,
      recommendation: descRec,
    },
    robots: {
      raw: robotsRaw,
      isIndexable,
      isFollowable,
      directives,
    },
    canonical: {
      raw: canonicalRaw,
      status: canonicalStatus,
      isSelfReferencing,
      recommendation: canonicalRec,
    },
    charset,
    viewport: {
      raw: viewportRaw,
      isMobileOptimized,
    },
    hreflangs,
  };
}

export function scanOpenGraph(doc: ParsedHtmlDocument): OpenGraphAudit {
  const ogTitle = doc.metas.find((m) => m.property === 'og:title')?.content || null;
  const ogDesc = doc.metas.find((m) => m.property === 'og:description')?.content || null;
  const ogImage = doc.metas.find((m) => m.property === 'og:image' || m.property === 'og:image:url')?.content || null;
  const ogUrl = doc.metas.find((m) => m.property === 'og:url')?.content || null;
  const ogType = doc.metas.find((m) => m.property === 'og:type')?.content || null;
  const ogSiteName = doc.metas.find((m) => m.property === 'og:site_name')?.content || null;
  const ogLocale = doc.metas.find((m) => m.property === 'og:locale')?.content || null;

  const missingRequired: string[] = [];
  if (!ogTitle) missingRequired.push('og:title');
  if (!ogDesc) missingRequired.push('og:description');
  if (!ogImage) missingRequired.push('og:image');
  if (!ogUrl) missingRequired.push('og:url');

  const present = !!(ogTitle || ogDesc || ogImage || ogUrl);
  let status: OpenGraphAudit['status'] = 'complete';
  if (!present) {
    status = 'missing';
  } else if (missingRequired.length > 0) {
    status = 'partial';
  }

  let isSecure = false;
  let format: string | null = null;
  if (ogImage) {
    isSecure = ogImage.startsWith('https://');
    const ext = ogImage.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'svg'].includes(ext)) {
      format = ext;
    }
  }

  return {
    present,
    title: ogTitle,
    description: ogDesc,
    image: {
      url: ogImage,
      isSecure,
      format,
    },
    url: ogUrl,
    type: ogType,
    siteName: ogSiteName,
    locale: ogLocale,
    missingRequired,
    status,
  };
}

export function scanTwitterCard(doc: ParsedHtmlDocument): TwitterCardAudit {
  const card = doc.metas.find((m) => m.name === 'twitter:card')?.content || null;
  const title = doc.metas.find((m) => m.name === 'twitter:title')?.content || null;
  const description = doc.metas.find((m) => m.name === 'twitter:description')?.content || null;
  const image = doc.metas.find((m) => m.name === 'twitter:image' || m.name === 'twitter:image:src')?.content || null;
  const site = doc.metas.find((m) => m.name === 'twitter:site')?.content || null;
  const creator = doc.metas.find((m) => m.name === 'twitter:creator')?.content || null;

  const missingProperties: string[] = [];
  if (!card) missingProperties.push('twitter:card');
  if (!title) missingProperties.push('twitter:title');
  if (!description) missingProperties.push('twitter:description');
  if (!image) missingProperties.push('twitter:image');

  const present = !!(card || title || description || image || site);
  let status: TwitterCardAudit['status'] = 'complete';
  if (!present) {
    status = 'missing';
  } else if (missingProperties.length > 0) {
    status = 'partial';
  }

  return {
    present,
    card,
    title,
    description,
    image,
    site,
    creator,
    status,
    missingProperties,
  };
}

export function scanImageAltTags(doc: ParsedHtmlDocument): ImageAltAudit {
  const items: ImageAltAuditItem[] = [];
  let imagesWithAlt = 0;
  let imagesMissingAlt = 0;
  let decorativeImages = 0;
  let imagesMissingDimensions = 0;
  let imagesNonModernFormat = 0;

  for (const img of doc.images) {
    const issues: string[] = [];
    const hasAlt = img.alt !== null;
    const isDecorative = img.alt === '';
    const hasDimensions = !!(img.width && img.height);
    const isLazy = img.loading === 'lazy';

    // Format check
    const ext = img.src.split('?')[0].split('.').pop()?.toLowerCase();
    const isModernFormat = ext ? ['webp', 'avif', 'svg'].includes(ext) : false;

    if (!hasAlt) {
      imagesMissingAlt++;
      issues.push('Missing alt attribute (accessibility & image SEO violation).');
    } else if (isDecorative) {
      decorativeImages++;
    } else {
      imagesWithAlt++;
      if (img.alt && img.alt.length > 125) {
        issues.push('Alt text is too long (>125 chars). Keep concise for screen readers.');
      }
    }

    if (!hasDimensions) {
      imagesMissingDimensions++;
      issues.push('Missing explicit width & height attributes (Direct Cumulative Layout Shift / CLS risk).');
    }

    if (ext && ['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(ext) && !isModernFormat) {
      imagesNonModernFormat++;
      issues.push('Consider converting to next-gen WebP or AVIF format for faster LCP.');
    }

    items.push({
      src: img.src,
      alt: img.alt,
      hasAlt,
      isDecorative,
      hasDimensions,
      width: img.width,
      height: img.height,
      isLazy,
      format: ext,
      issues,
    });
  }

  const total = doc.images.length;
  let score = 100;
  if (total > 0) {
    const missingAltPenalty = (imagesMissingAlt / total) * 40;
    const missingDimPenalty = (imagesMissingDimensions / total) * 35;
    const legacyFormatPenalty = (imagesNonModernFormat / total) * 15;
    score = Math.max(0, Math.round(100 - missingAltPenalty - missingDimPenalty - legacyFormatPenalty));
  }

  const recommendations: string[] = [];
  if (imagesMissingAlt > 0) {
    recommendations.push(`Add descriptive, keyword-relevant alt attributes to ${imagesMissingAlt} image(s).`);
  }
  if (imagesMissingDimensions > 0) {
    recommendations.push(`Set explicit width and height attributes on ${imagesMissingDimensions} image(s) to prevent Cumulative Layout Shift (CLS).`);
  }
  if (imagesNonModernFormat > 0) {
    recommendations.push(`Optimize ${imagesNonModernFormat} image(s) into next-gen WebP or AVIF formats for enhanced loading performance.`);
  }

  return {
    totalImages: total,
    imagesWithAlt,
    imagesMissingAlt,
    decorativeImages,
    imagesMissingDimensions,
    imagesNonModernFormat,
    score,
    items: items.slice(0, 50), // Cap output list
    recommendations,
  };
}

export async function scanOnPageSeo(input: OnPageScanInput): Promise<OnPageScanResult> {
  let html = input.html || '';
  let url = input.url;

  if (!html && url) {
    // Fetch live URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Antigravity-SEO-MCP)',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL ${url}: ${response.status} ${response.statusText}`);
    }
    html = await response.text();
  }

  if (!html) {
    throw new Error('Either "html" content or a valid "url" must be provided.');
  }

  const doc = parseHtml(html);
  const meta = scanMetaTags(doc, url);
  const openGraph = scanOpenGraph(doc);
  const twitter = scanTwitterCard(doc);
  const images = scanImageAltTags(doc);

  let passed = 0;
  let warnings = 0;
  let critical = 0;
  const recommendations: string[] = [];

  // Evaluate Meta Title
  if (meta.title.status === 'optimal') passed++;
  else if (meta.title.status === 'missing') {
    critical++;
    if (meta.title.recommendation) recommendations.push(meta.title.recommendation);
  } else {
    warnings++;
    if (meta.title.recommendation) recommendations.push(meta.title.recommendation);
  }

  // Evaluate Meta Description
  if (meta.description.status === 'optimal') passed++;
  else if (meta.description.status === 'missing') {
    critical++;
    if (meta.description.recommendation) recommendations.push(meta.description.recommendation);
  } else {
    warnings++;
    if (meta.description.recommendation) recommendations.push(meta.description.recommendation);
  }

  // Evaluate Canonical
  if (meta.canonical.status === 'valid') passed++;
  else if (meta.canonical.status === 'missing') {
    warnings++;
    if (meta.canonical.recommendation) recommendations.push(meta.canonical.recommendation);
  } else {
    warnings++;
    if (meta.canonical.recommendation) recommendations.push(meta.canonical.recommendation);
  }

  // Evaluate Viewport
  if (meta.viewport.isMobileOptimized) passed++;
  else {
    critical++;
    recommendations.push('CRITICAL: Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` for mobile search friendliness.');
  }

  // Evaluate Open Graph & Twitter
  if (openGraph.status === 'complete') passed++;
  else if (openGraph.status === 'partial') {
    warnings++;
    recommendations.push(`Open Graph is incomplete. Missing: ${openGraph.missingRequired.join(', ')}.`);
  } else {
    warnings++;
    recommendations.push('Add Open Graph tags (og:title, og:description, og:image, og:url) for social shareability.');
  }

  if (twitter.status === 'complete') passed++;
  else if (twitter.status === 'partial') {
    warnings++;
    recommendations.push(`Twitter Cards are incomplete. Missing: ${twitter.missingProperties.join(', ')}.`);
  } else {
    warnings++;
    recommendations.push('Add Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image).');
  }

  // Evaluate Images
  if (images.imagesMissingAlt === 0 && images.imagesMissingDimensions === 0) passed++;
  else {
    if (images.imagesMissingAlt > 0) warnings++;
    if (images.imagesMissingDimensions > 0) warnings++;
    recommendations.push(...images.recommendations);
  }

  // Calculate Overall On-Page Score (0 - 100)
  const totalChecks = passed + warnings + critical;
  const score = Math.max(0, Math.min(100, Math.round(((passed * 1.0 + warnings * 0.4) / Math.max(1, totalChecks)) * 100)));

  return {
    url,
    meta,
    openGraph,
    twitter,
    images,
    summary: {
      passedChecks: passed,
      warnings,
      criticalIssues: critical,
      score,
    },
    recommendations: [...new Set(recommendations)],
  };
}
