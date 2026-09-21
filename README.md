# SEO-IntentRank MCP Server (`seo-intentrank`)

[![M8ven Score](https://m8ven.ai/badge/mcp/ai-buildinfra-seo-intentrank-ouv7e2)](https://m8ven.ai/mcp/ai-buildinfra-seo-intentrank-ouv7e2)
[![CI](https://github.com/AI-BuildInfra/SEO-intentrank/actions/workflows/ci.yml/badge.svg)](https://github.com/AI-BuildInfra/SEO-intentrank/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/seo-intentrank.svg?style=flat-square)](https://www.npmjs.com/package/seo-intentrank)
[![license](https://img.shields.io/npm/l/seo-intentrank.svg?style=flat-square)](https://github.com/AI-BuildInfra/SEO-intentrank/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/AI-BuildInfra/SEO-intentrank.svg?style=flat-square)](https://github.com/AI-BuildInfra/SEO-intentrank)

> **Official Model Context Protocol (MCP) Server for SEO-IntentRank: Human Search Intent Keywords, Technical SEO Audits, Google Lighthouse Core Web Vitals (CLS/LCP/INP), and On-Page Diagnostic Intelligence.**

Developed and maintained by [AI Build Infra](https://aibuildinfra.com/).

---

## 🌟 Overview

**SEO-IntentRank** is an enterprise-grade SEO diagnostic MCP Server designed for AI coding assistants and automation workflows (Google Antigravity, Claude Desktop, Cursor, ChatGPT). It bridges the gap between raw technical crawl data and real human search behavior, delivering deep on-page audits, direct Google Lighthouse Core Web Vitals (including Cumulative Layout Shift / CLS), and semantic **Human Search Intent Keyword extraction**.

### Core Capabilities:
1. **Human Intent Keyword Engine**: Categorizes page search intent into **Informational**, **Commercial Investigation**, **Transactional**, and **Navigational**; synthesizes high-converting natural human search queries; mines answered questions; and flags AI slop clichés and keyword stuffing.
2. **On-Page SEO Inspection**: Scans `<title>` (character length & pixel width estimates), `<meta name="description">` (CTA detection), `<meta name="robots">`, Open Graph tags (`og:*`), Twitter Cards (`twitter:*`), and Canonical URL verification.
3. **Media & Image Alt Audit**: Detects missing `alt` attributes, decorative images (`alt=""`), and **missing `width`/`height` attributes that cause Cumulative Layout Shift (CLS)**.
4. **Lighthouse Core Web Vitals**: Fetches exact numeric scores directly from Google Lighthouse / PageSpeed Insights for:
   - **Cumulative Layout Shift (CLS)** with threshold analysis ($\le 0.1$ Good) and shift element culprit identification.
   - **Largest Contentful Paint (LCP)**, **Interaction to Next Paint (INP)**, **First Contentful Paint (FCP)**, and **Time to First Byte (TTFB)**.
   - Fallback to local DOM-based layout shift heuristics when auditing raw HTML offline.
5. **Technical SEO Hierarchy**: Checks single `<h1>` enforcement, non-sequential heading level skips (e.g. H1 &rarr; H3), Schema.org JSON-LD structured data validation, `robots.txt` disallows, `sitemap.xml`, and text-to-HTML ratios.

---

## 🚀 Installation & Quick Start

### Running with NPX
```bash
npx -y seo-intentrank
```

### Adding to Antigravity / Claude Desktop Configuration

Add the following to your `mcpServers` configuration (`mcp_config.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "seo-intentrank": {
      "command": "npx",
      "args": ["-y", "seo-intentrank"]
    }
  }
}
```

Or for local development:
```json
{
  "mcpServers": {
    "seo-intentrank": {
      "command": "node",
      "args": ["C:/path/to/seo-mcp-server/dist/index.js"]
    }
  }
}
```

---

## 🛠️ Available MCP Tools

### 1. `extract_human_intent_keywords`
Extracts high-converting Human Search Intent Keywords and analyzes audience search behavior.

**Parameters:**
- `url` *(string, optional)*: Live URL.
- `html` *(string, optional)*: Raw HTML markup.
- `text` *(string, optional)*: Plain article text.
- `targetKeyword` *(string, optional)*: Target focus keyword to evaluate.

**Output:**
- Primary search intent & percentage distribution (`informational`, `commercial`, `transactional`, `navigational`).
- Top ranked human intent keywords with relevance scores and heading signals.
- Synthesized natural human search queries answered by the page.
- Mined questions with answered status.
- Information Gain & AI slop fluff assessment score.

---

### 2. `scan_onpage_seo`
Audits On-Page SEO elements from a live URL or raw HTML string.

**Parameters:**
- `url` *(string, optional)*: Web URL to fetch and audit.
- `html` *(string, optional)*: Raw HTML string for offline analysis.

**Output:**
- Title status, length, and pixel width estimate (~580px Google cutoff).
- Meta description length & CTA presence.
- Complete Open Graph & Twitter Card validation.
- Canonical tag status (self-referencing, missing, relative, or mismatched).
- Image Alt tag audit with missing dimensions (CLS risk detection).

---

### 3. `audit_lighthouse_cls_vitals`
Audits Core Web Vitals directly using Google Lighthouse / PageSpeed API and local DOM shift heuristics.

**Parameters:**
- `url` *(string, optional)*: Live URL to benchmark.
- `html` *(string, optional)*: HTML snippet for local layout shift risk calculation.
- `strategy` *(string, optional)*: `'mobile'` (default) or `'desktop'`.
- `apiKey` *(string, optional)*: Optional Google PageSpeed Insights API key.

**Output:**
- Cumulative Layout Shift (CLS) score, rating (`GOOD`, `NEEDS_IMPROVEMENT`, `POOR`), and layout shift culprit elements.
- LCP, INP, FCP, TTFB measurements.
- Lighthouse category scores (Performance, SEO, Accessibility, Best Practices).

---

### 4. `audit_technical_seo`
Inspects technical page architecture and semantic structure.

**Parameters:**
- `url` *(string, optional)*: Live URL.
- `html` *(string, optional)*: Raw HTML string.
- `robotsTxtContent` *(string, optional)*: Raw `robots.txt` string to parse.
- `sitemapXmlContent` *(string, optional)*: Raw `sitemap.xml` string to parse.

**Output:**
- Heading structure validation (H1 count, non-sequential heading level skips).
- Schema.org JSON-LD syntax and `@type` verification.
- Content word count, text-to-HTML ratio, and thin content warnings.
- Robots directives and Sitemap URL counts.

---

### 5. `comprehensive_seo_audit`
Master all-in-one SEO auditor running all tools in parallel and producing an executive report.

**Parameters:**
- `url` *(string, optional)*: Live URL.
- `html` *(string, optional)*: Raw HTML markup.
- `strategy` *(string, optional)*: `'mobile'` | `'desktop'`.
- `apiKey` *(string, optional)*: Optional Google PageSpeed API key.
- `targetKeyword` *(string, optional)*: Target focus keyword.

**Output:**
- Overall SEO score (0-100) and letter grade (`A+`, `A`, `B`, `C`, `D`, `F`).
- Aggregated On-Page, Technical, Lighthouse, and Intent audits.
- Prioritized action plan sorted by impact (`HIGH`, `MEDIUM`, `LOW`).

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```

---

## 📄 License
MIT License. Created with ❤️ by [AI Build Infra](https://aibuildinfra.com/).
