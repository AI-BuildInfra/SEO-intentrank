/**
 * Technical SEO Auditor Tool
 * Headings hierarchy, Schema.org JSON-LD structured data, Robots.txt, Sitemap.xml & Network signals
 */
import { parseHtml } from '../utils/html-parser.js';
export function auditHeadingHierarchy(doc) {
    const headings = doc.headings.map((h) => ({
        level: h.level,
        text: h.text,
        charCount: h.text.length,
    }));
    const h1s = headings.filter((h) => h.level === 1);
    const skippedLevels = [];
    const recommendations = [];
    let lastLevel = 0;
    for (const h of headings) {
        if (lastLevel > 0 && h.level > lastLevel + 1) {
            skippedLevels.push(`Skipped from H${lastLevel} directly to H${h.level} ("${h.text.slice(0, 40)}...")`);
        }
        lastLevel = h.level;
    }
    let structureStatus = 'optimal';
    if (h1s.length === 0) {
        structureStatus = 'missing_h1';
        recommendations.push('CRITICAL: Missing <h1> tag. Every indexable page must have exactly one descriptive <h1>.');
    }
    else if (h1s.length > 1) {
        structureStatus = 'multiple_h1';
        recommendations.push(`Multiple <h1> tags found (${h1s.length}). Consolidate into a single primary <h1> to preserve semantic hierarchy.`);
    }
    if (skippedLevels.length > 0) {
        if (structureStatus === 'optimal')
            structureStatus = 'skipped_levels';
        recommendations.push(`Heading levels are non-sequential (${skippedLevels.length} skips detected). Ensure headings step down logically (e.g. H1 -> H2 -> H3).`);
    }
    return {
        totalHeadings: headings.length,
        h1Count: h1s.length,
        structureStatus,
        skippedLevels,
        headings,
        recommendations,
    };
}
export function auditSchemaOrg(doc) {
    const schemas = [];
    const schemaTypes = [];
    const syntaxErrors = [];
    const warnings = [];
    for (let i = 0; i < doc.jsonLdScripts.length; i++) {
        const raw = doc.jsonLdScripts[i];
        try {
            const parsed = JSON.parse(raw);
            schemas.push(parsed);
            const extractTypes = (obj) => {
                if (!obj || typeof obj !== 'object')
                    return;
                if (obj['@type']) {
                    if (Array.isArray(obj['@type']))
                        schemaTypes.push(...obj['@type']);
                    else
                        schemaTypes.push(String(obj['@type']));
                }
                if (Array.isArray(obj['@graph'])) {
                    for (const item of obj['@graph'])
                        extractTypes(item);
                }
            };
            extractTypes(parsed);
            // Check context
            const context = parsed['@context'] || (Array.isArray(parsed['@graph']) && parsed['@graph'][0]?.['@context']);
            if (context && !String(context).includes('schema.org')) {
                warnings.push(`Schema script #${i + 1} has unexpected @context: "${context}". Expected "https://schema.org".`);
            }
        }
        catch (err) {
            syntaxErrors.push(`JSON-LD script #${i + 1} has syntax error: ${err.message}`);
        }
    }
    const uniqueTypes = [...new Set(schemaTypes)];
    if (schemas.length === 0) {
        warnings.push('No Schema.org JSON-LD structured data detected. Add schema markup (e.g. Article, Organization, Product, FAQPage, BreadcrumbList) for rich snippet eligibility.');
    }
    return {
        found: schemas.length > 0,
        totalSchemas: schemas.length,
        schemaTypes: uniqueTypes,
        schemas,
        syntaxErrors,
        warnings,
    };
}
export function parseRobotsTxt(content) {
    const lines = content.split(/\r?\n/);
    let disallowCount = 0;
    let hasSitemapDirective = false;
    for (const line of lines) {
        const trimmed = line.trim();
        if (/^disallow\s*:/i.test(trimmed))
            disallowCount++;
        if (/^sitemap\s*:/i.test(trimmed))
            hasSitemapDirective = true;
    }
    return { hasSitemapDirective, disallowCount };
}
export function parseSitemapXml(content) {
    const urls = [];
    const locRegex = /<loc\s*>([\s\S]*?)<\/loc\s*>/gi;
    let match;
    while ((match = locRegex.exec(content)) !== null) {
        const u = match[1].trim();
        if (u)
            urls.push(u);
    }
    return { totalUrls: urls.length, urls: urls.slice(0, 20) };
}
export async function auditTechnicalSeo(input) {
    let html = input.html || '';
    let url = input.url;
    if (!html && url) {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Antigravity-SEO-MCP)',
            },
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch URL ${url}: ${res.status} ${res.statusText}`);
        }
        html = await res.text();
    }
    if (!html) {
        throw new Error('Either "html" content or a valid "url" must be provided.');
    }
    const doc = parseHtml(html);
    const headings = auditHeadingHierarchy(doc);
    const schema = auditSchemaOrg(doc);
    // Content & Text metrics
    const words = doc.plainText.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const ratio = doc.htmlSizeBytes > 0 ? Number(((doc.textSizeBytes / doc.htmlSizeBytes) * 100).toFixed(2)) : 0;
    const readingTime = Math.max(1, Math.round(wordCount / 200));
    const thinContent = wordCount < 250;
    const recommendations = [];
    let passed = 0;
    let warnings = 0;
    let critical = 0;
    // Evaluate Headings
    if (headings.structureStatus === 'optimal') {
        passed++;
    }
    else if (headings.structureStatus === 'missing_h1') {
        critical++;
        recommendations.push(...headings.recommendations);
    }
    else {
        warnings++;
        recommendations.push(...headings.recommendations);
    }
    // Evaluate Schema
    if (schema.found && schema.syntaxErrors.length === 0) {
        passed++;
    }
    else if (schema.syntaxErrors.length > 0) {
        critical++;
        recommendations.push(...schema.syntaxErrors);
    }
    else {
        warnings++;
        recommendations.push(...schema.warnings);
    }
    // Evaluate Word Count & Thin Content
    if (!thinContent) {
        passed++;
    }
    else {
        warnings++;
        recommendations.push(`Content is thin (${wordCount} words). Expand with high information-gain details, practical steps, or empirical data.`);
    }
    // Robots & Sitemap handling if URL or custom strings provided
    let robotsData;
    let sitemapData;
    if (input.robotsTxtContent) {
        const parsed = parseRobotsTxt(input.robotsTxtContent);
        robotsData = {
            fetched: true,
            hasSitemapDirective: parsed.hasSitemapDirective,
            disallowCount: parsed.disallowCount,
            raw: input.robotsTxtContent,
        };
    }
    else if (url) {
        try {
            const robotsUrl = new URL('/robots.txt', url).toString();
            const robRes = await fetch(robotsUrl);
            if (robRes.ok) {
                const text = await robRes.text();
                const parsed = parseRobotsTxt(text);
                robotsData = {
                    fetched: true,
                    hasSitemapDirective: parsed.hasSitemapDirective,
                    disallowCount: parsed.disallowCount,
                };
                if (!parsed.hasSitemapDirective) {
                    recommendations.push('robots.txt is missing a `Sitemap: https://example.com/sitemap.xml` directive.');
                }
            }
        }
        catch {
            // ignore
        }
    }
    if (input.sitemapXmlContent) {
        const parsed = parseSitemapXml(input.sitemapXmlContent);
        sitemapData = {
            fetched: true,
            totalUrlsFound: parsed.totalUrls,
            sampleUrls: parsed.urls,
        };
    }
    else if (url) {
        try {
            const sitemapUrl = new URL('/sitemap.xml', url).toString();
            const siteRes = await fetch(sitemapUrl);
            if (siteRes.ok) {
                const text = await siteRes.text();
                const parsed = parseSitemapXml(text);
                sitemapData = {
                    fetched: true,
                    totalUrlsFound: parsed.totalUrls,
                    sampleUrls: parsed.urls,
                };
            }
        }
        catch {
            // ignore
        }
    }
    const totalChecks = passed + warnings + critical;
    const score = Math.max(0, Math.min(100, Math.round(((passed * 1.0 + warnings * 0.4) / Math.max(1, totalChecks)) * 100)));
    return {
        url,
        headings,
        schema,
        contentMetrics: {
            wordCount,
            plainTextSizeBytes: doc.textSizeBytes,
            htmlSizeBytes: doc.htmlSizeBytes,
            textToHtmlRatio: ratio,
            readingTimeMinutes: readingTime,
            thinContentWarning: thinContent,
        },
        robotsTxt: robotsData,
        sitemapXml: sitemapData,
        summary: {
            score,
            criticalIssues: critical,
            warnings,
            passedChecks: passed,
        },
        recommendations: [...new Set(recommendations)],
    };
}
