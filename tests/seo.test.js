import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { scanOnPageSeo } from '../dist/tools/onpage-scanner.js';
import { auditLighthouseVitals } from '../dist/tools/lighthouse-cls.js';
import { auditTechnicalSeo, parseRobotsTxt, parseSitemapXml } from '../dist/tools/technical-seo.js';
import { extractHumanIntentKeywords } from '../dist/tools/human-intent.js';
import { runComprehensiveSeoAudit } from '../dist/tools/full-audit.js';

describe('SEO MCP Server - Comprehensive Test Suite', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Best SEO MCP Server Guide 2026 - Technical Audit</title>
      <meta name="description" content="Discover how to optimize on-page SEO, eliminate Cumulative Layout Shift (CLS), and capture high-converting human search intent keywords today.">
      <meta name="robots" content="index, follow">
      <link rel="canonical" href="https://example.com/seo-guide">
      <link rel="alternate" hreflang="es" href="https://example.com/es/seo-guide">
      
      <!-- Open Graph -->
      <meta property="og:title" content="Best SEO MCP Server Guide 2026">
      <meta property="og:description" content="Discover how to optimize on-page SEO and CLS scores.">
      <meta property="og:image" content="https://example.com/images/hero.webp">
      <meta property="og:url" content="https://example.com/seo-guide">
      <meta property="og:type" content="article">
      <meta property="og:site_name" content="AI Build Infra">

      <!-- Twitter Card -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Best SEO MCP Server Guide 2026">
      <meta name="twitter:description" content="Discover how to optimize on-page SEO and CLS scores.">
      <meta name="twitter:image" content="https://example.com/images/hero.webp">

      <!-- Schema.org JSON-LD -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Best SEO MCP Server Guide 2026",
        "author": {
          "@type": "Person",
          "name": "Alex Mercer"
        }
      }
      </script>
    </head>
    <body>
      <header>
        <h1>Best SEO MCP Server Guide: Optimizing Technical Architecture</h1>
      </header>
      <main>
        <p>In this guide, we explore how to configure your website for maximum visibility and eliminate Cumulative Layout Shift (CLS).</p>
        <img src="https://example.com/images/hero.webp" alt="SEO Architecture Diagram" width="1200" height="630" loading="lazy">
        <img src="https://example.com/images/bad-image.png">

        <h2>Why Cumulative Layout Shift (CLS) Matters for Core Web Vitals</h2>
        <p>Cumulative layout shift measures visual stability. What is the target CLS score for Google ranking?</p>
        <p>Google requires a CLS score of 0.1 or lower for a Good rating.</p>

        <h3>Step-by-Step Implementation Strategy</h3>
        <p>Follow these exact steps to benchmark performance metrics and boost organic search intent alignment.</p>
      </main>
    </body>
    </html>
  `;

  describe('1. On-Page SEO Scanner', () => {
    it('should correctly scan meta title, description, OG, Twitter and Canonical tags', async () => {
      const res = await scanOnPageSeo({ html: sampleHtml, url: 'https://example.com/seo-guide' });

      // Title
      assert.equal(res.meta.title.status, 'optimal');
      assert.equal(res.meta.title.raw, 'Best SEO MCP Server Guide 2026 - Technical Audit');
      assert.ok(res.meta.title.pixelWidthEstimate > 350);

      // Description
      assert.equal(res.meta.description.status, 'optimal');
      assert.equal(res.meta.description.hasCallToAction, true);

      // Canonical
      assert.equal(res.meta.canonical.status, 'valid');
      assert.equal(res.meta.canonical.raw, 'https://example.com/seo-guide');

      // Open Graph
      assert.equal(res.openGraph.status, 'complete');
      assert.equal(res.openGraph.title, 'Best SEO MCP Server Guide 2026');
      assert.equal(res.openGraph.image.isSecure, true);
      assert.equal(res.openGraph.image.format, 'webp');

      // Twitter
      assert.equal(res.twitter.status, 'complete');
      assert.equal(res.twitter.card, 'summary_large_image');

      // Image Alt & CLS Dimensions
      assert.equal(res.images.totalImages, 2);
      assert.equal(res.images.imagesWithAlt, 1);
      assert.equal(res.images.imagesMissingAlt, 1);
      assert.equal(res.images.imagesMissingDimensions, 1); // bad-image.png has no width/height
    });

    it('should flag missing title, description, and canonical tags', async () => {
      const bareHtml = '<html><head></head><body><h1>Hello World</h1></body></html>';
      const res = await scanOnPageSeo({ html: bareHtml });

      assert.equal(res.meta.title.status, 'missing');
      assert.equal(res.meta.description.status, 'missing');
      assert.equal(res.meta.canonical.status, 'missing');
      assert.equal(res.openGraph.status, 'missing');
      assert.equal(res.twitter.status, 'missing');
      assert.ok(res.summary.criticalIssues >= 2);
    });
  });

  describe('2. Lighthouse Core Web Vitals & CLS Auditor', () => {
    it('should compute local CLS risk heuristics and flag unsized media', async () => {
      const htmlWithClsRisk = `
        <html><body>
          <img src="banner.jpg">
          <img src="popup.jpg">
          <iframe src="https://youtube.com/embed/test"></iframe>
        </body></html>
      `;
      const res = await auditLighthouseVitals({ html: htmlWithClsRisk });

      assert.equal(res.source, 'local_heuristic');
      assert.ok(res.coreWebVitals.cls.score > 0);
      assert.ok(res.clsHeuristicRisks && res.clsHeuristicRisks.length >= 2);
      assert.ok(res.coreWebVitals.cls.culprits && res.coreWebVitals.cls.culprits.length > 0);
    });
  });

  describe('3. Technical SEO Auditor', () => {
    it('should validate single H1, heading hierarchy and JSON-LD schema', async () => {
      const res = await auditTechnicalSeo({ html: sampleHtml });

      assert.equal(res.headings.h1Count, 1);
      assert.equal(res.headings.structureStatus, 'optimal');
      assert.equal(res.schema.found, true);
      assert.ok(res.schema.schemaTypes.includes('Article'));
      assert.equal(res.schema.syntaxErrors.length, 0);
      assert.ok(res.contentMetrics.wordCount > 50);
    });

    it('should flag multiple H1s and skipped heading levels', async () => {
      const brokenHeadingsHtml = `
        <html><body>
          <h1>First Heading</h1>
          <h1>Second Heading</h1>
          <h4>Deep Skipped Heading</h4>
        </body></html>
      `;
      const res = await auditTechnicalSeo({ html: brokenHeadingsHtml });

      assert.equal(res.headings.h1Count, 2);
      assert.equal(res.headings.structureStatus, 'multiple_h1');
      assert.ok(res.headings.skippedLevels.length > 0);
    });

    it('should parse robots.txt and sitemap.xml directives correctly', () => {
      const robots = `
        User-agent: *
        Disallow: /admin/
        Disallow: /checkout/
        Sitemap: https://example.com/sitemap.xml
      `;
      const parsedRobots = parseRobotsTxt(robots);
      assert.equal(parsedRobots.disallowCount, 2);
      assert.equal(parsedRobots.hasSitemapDirective, true);

      const sitemap = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <loc>https://example.com/page-1</loc>
          <loc>https://example.com/page-2</loc>
        </urlset>
      `;
      const parsedSitemap = parseSitemapXml(sitemap);
      assert.equal(parsedSitemap.totalUrls, 2);
      assert.equal(parsedSitemap.urls[0], 'https://example.com/page-1');
    });
  });

  describe('4. Human Intent Keywords Engine', () => {
    it('should classify informational intent and extract natural human queries', async () => {
      const res = await extractHumanIntentKeywords({ html: sampleHtml });

      assert.ok(res.topIntentKeywords.length > 0);
      assert.ok(res.synthesizedHumanQueries.length > 0);
      assert.ok(res.minedQuestions.length > 0);
      assert.equal(res.minedQuestions[0].question.includes('What is the target CLS score'), true);
      assert.ok(res.intentDistribution.informational >= 30);
    });

    it('should identify commercial and transactional intents properly', async () => {
      const commercialText = `
        Review and comparison of top SEO tools 2026.
        Discover the best alternative software, benchmark ratings, and pros and cons.
      `;
      const commRes = await extractHumanIntentKeywords({ text: commercialText });
      assert.equal(commRes.primaryIntent, 'commercial');

      const transactionalText = `
        Buy enterprise SEO subscription now.
        Get 50% discount coupon on monthly pricing plans and start your free trial order.
      `;
      const transRes = await extractHumanIntentKeywords({ text: transactionalText });
      assert.equal(transRes.primaryIntent, 'transactional');
    });
  });

  describe('5. Comprehensive All-in-One SEO Audit', () => {
    it('should generate an unified report with score, grade and prioritized action plan', async () => {
      const res = await runComprehensiveSeoAudit({ html: sampleHtml, url: 'https://example.com/seo-guide' });

      assert.ok(res.overallSeoScore >= 60);
      assert.ok(['A+', 'A', 'B', 'C'].includes(res.grade));
      assert.ok(res.prioritizedActionPlan.length > 0);
      assert.ok(res.onpage.meta.title.status === 'optimal');
      assert.ok(res.technical.headings.h1Count === 1);
    });
  });
});
