/**
 * Comprehensive All-in-One SEO Auditor Tool
 * Orchestrates on-page scan, technical audit, Lighthouse Core Web Vitals (CLS/LCP/INP),
 * and Human Intent keyword intelligence into a prioritized, actionable SEO health report.
 */
import { scanOnPageSeo } from './onpage-scanner.js';
import { auditLighthouseVitals } from './lighthouse-cls.js';
import { auditTechnicalSeo } from './technical-seo.js';
import { extractHumanIntentKeywords } from './human-intent.js';
export async function runComprehensiveSeoAudit(input) {
    const [onpage, lighthouse, technical, humanIntent] = await Promise.all([
        scanOnPageSeo({ url: input.url, html: input.html }),
        auditLighthouseVitals({
            url: input.url,
            html: input.html,
            apiKey: input.apiKey,
            strategy: input.strategy || 'mobile',
        }),
        auditTechnicalSeo({ url: input.url, html: input.html }),
        extractHumanIntentKeywords({
            url: input.url,
            html: input.html,
            targetKeyword: input.targetKeyword,
        }),
    ]);
    // Aggregate scores
    const onpageScore = onpage.summary.score;
    const techScore = technical.summary.score;
    const imageScore = onpage.images.score;
    const intentScore = humanIntent.intentAlignmentScore;
    let lhScore = 80;
    if (lighthouse.categories?.seo) {
        lhScore = lighthouse.categories.seo;
    }
    else if (lighthouse.coreWebVitals.cls.rating === 'GOOD') {
        lhScore = 90;
    }
    else if (lighthouse.coreWebVitals.cls.rating === 'NEEDS_IMPROVEMENT') {
        lhScore = 70;
    }
    else {
        lhScore = 50;
    }
    const overallSeoScore = Math.round(onpageScore * 0.3 +
        techScore * 0.25 +
        imageScore * 0.15 +
        intentScore * 0.15 +
        lhScore * 0.15);
    let grade = 'F';
    if (overallSeoScore >= 95)
        grade = 'A+';
    else if (overallSeoScore >= 85)
        grade = 'A';
    else if (overallSeoScore >= 75)
        grade = 'B';
    else if (overallSeoScore >= 65)
        grade = 'C';
    else if (overallSeoScore >= 50)
        grade = 'D';
    const criticalIssuesCount = onpage.summary.criticalIssues + technical.summary.criticalIssues;
    const warningIssuesCount = onpage.summary.warnings + technical.summary.warnings;
    const passedChecksCount = onpage.summary.passedChecks + technical.summary.passedChecks;
    // Prioritized action plan
    const actionPlan = [];
    // Critical items
    if (onpage.meta.title.status === 'missing') {
        actionPlan.push({
            priority: 'HIGH',
            category: 'Meta & Social',
            action: 'Add a targeted <title> tag between 50-60 characters.',
            impact: 'Essential for Google ranking and SERP click-through rate.',
        });
    }
    if (onpage.meta.description.status === 'missing') {
        actionPlan.push({
            priority: 'HIGH',
            category: 'Meta & Social',
            action: 'Add a <meta name="description"> tag between 120-160 characters with a clear CTA.',
            impact: 'Improves snippet quality and SERP CTR.',
        });
    }
    if (technical.headings.structureStatus === 'missing_h1') {
        actionPlan.push({
            priority: 'HIGH',
            category: 'Technical',
            action: 'Add a single <h1> heading containing your primary human intent topic.',
            impact: 'Crucial for semantic clarity and topic indexing.',
        });
    }
    if (lighthouse.coreWebVitals.cls.rating === 'POOR') {
        actionPlan.push({
            priority: 'HIGH',
            category: 'Image & CLS',
            action: 'Fix Cumulative Layout Shift (CLS > 0.25) by reserving dimensions on all media/ads.',
            impact: 'Core Web Vital ranking signal and user retention factor.',
        });
    }
    // Medium items
    if (onpage.images.imagesMissingAlt > 0) {
        actionPlan.push({
            priority: 'MEDIUM',
            category: 'Image & CLS',
            action: `Add descriptive alt text to ${onpage.images.imagesMissingAlt} image(s).`,
            impact: 'Accessibility standard & Google Image search traffic.',
        });
    }
    if (onpage.openGraph.status !== 'complete') {
        actionPlan.push({
            priority: 'MEDIUM',
            category: 'Meta & Social',
            action: 'Complete missing Open Graph tags (og:title, og:description, og:image, og:url).',
            impact: 'Ensures rich previews on social sharing platforms.',
        });
    }
    if (!technical.schema.found) {
        actionPlan.push({
            priority: 'MEDIUM',
            category: 'Technical',
            action: 'Add Schema.org JSON-LD structured data (Article, FAQPage, Organization, etc.).',
            impact: 'Enables rich Google SERP snippet badges and Knowledge Graph entity authority.',
        });
    }
    // Low items
    if (humanIntent.intentAlignmentScore < 70) {
        actionPlan.push({
            priority: 'LOW',
            category: 'Human Intent & Content',
            action: 'Align page copy tone with user search intent (reduce hard-sell pitch on informational guides).',
            impact: 'Decreases bounce rates and improves dwell time.',
        });
    }
    return {
        scannedUrl: input.url,
        overallSeoScore,
        grade,
        summary: {
            criticalIssuesCount,
            warningIssuesCount,
            passedChecksCount,
        },
        onpage: {
            meta: onpage.meta,
            openGraph: onpage.openGraph,
            twitter: onpage.twitter,
            images: onpage.images,
        },
        technical: {
            headings: technical.headings,
            schema: technical.schema,
            wordCount: technical.contentMetrics.wordCount,
            textToHtmlRatio: technical.contentMetrics.textToHtmlRatio,
        },
        lighthouse,
        humanIntent,
        prioritizedActionPlan: actionPlan,
    };
}
