/**
 * Type definitions for SEO MCP Server
 * Comprehensive On-Page, Technical SEO, Lighthouse CLS & Human Intent Engine
 */
export interface MetaTagAudit {
    title: {
        raw: string | null;
        length: number;
        pixelWidthEstimate: number;
        status: 'optimal' | 'too_short' | 'too_long' | 'missing';
        recommendation?: string;
    };
    description: {
        raw: string | null;
        length: number;
        status: 'optimal' | 'too_short' | 'too_long' | 'missing';
        hasCallToAction: boolean;
        recommendation?: string;
    };
    robots: {
        raw: string | null;
        isIndexable: boolean;
        isFollowable: boolean;
        directives: string[];
    };
    canonical: {
        raw: string | null;
        status: 'valid' | 'missing' | 'mismatched' | 'relative';
        isSelfReferencing?: boolean;
        recommendation?: string;
    };
    charset: string | null;
    viewport: {
        raw: string | null;
        isMobileOptimized: boolean;
    };
    hreflangs: Array<{
        lang: string;
        href: string;
    }>;
}
export interface OpenGraphAudit {
    present: boolean;
    title: string | null;
    description: string | null;
    image: {
        url: string | null;
        isSecure: boolean;
        format: string | null;
    };
    url: string | null;
    type: string | null;
    siteName: string | null;
    locale: string | null;
    missingRequired: string[];
    status: 'complete' | 'partial' | 'missing';
}
export interface TwitterCardAudit {
    present: boolean;
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
    site: string | null;
    creator: string | null;
    status: 'complete' | 'partial' | 'missing';
    missingProperties: string[];
}
export interface ImageAltAuditItem {
    src: string;
    alt: string | null;
    hasAlt: boolean;
    isDecorative: boolean;
    hasDimensions: boolean;
    width?: string;
    height?: string;
    isLazy: boolean;
    format?: string;
    issues: string[];
}
export interface ImageAltAudit {
    totalImages: number;
    imagesWithAlt: number;
    imagesMissingAlt: number;
    decorativeImages: number;
    imagesMissingDimensions: number;
    imagesNonModernFormat: number;
    score: number;
    items: ImageAltAuditItem[];
    recommendations: string[];
}
export interface HeadingItem {
    level: number;
    text: string;
    charCount: number;
}
export interface HeadingHierarchyAudit {
    totalHeadings: number;
    h1Count: number;
    structureStatus: 'optimal' | 'multiple_h1' | 'missing_h1' | 'skipped_levels';
    skippedLevels: string[];
    headings: HeadingItem[];
    recommendations: string[];
}
export interface SchemaOrgAudit {
    found: boolean;
    totalSchemas: number;
    schemaTypes: string[];
    schemas: any[];
    syntaxErrors: string[];
    warnings: string[];
}
export interface LighthouseVitalsAudit {
    source: 'google_lighthouse_api' | 'local_heuristic';
    url?: string;
    fetchTime?: string;
    device?: 'mobile' | 'desktop';
    categories?: {
        performance: number | null;
        seo: number | null;
        accessibility: number | null;
        bestPractices: number | null;
    };
    coreWebVitals: {
        cls: {
            score: number;
            rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';
            description: string;
            culprits?: Array<{
                element?: string;
                nodeSnippet?: string;
                shiftScore?: number;
            }>;
        };
        lcp: {
            valueMs: number | null;
            formatted: string;
            rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A';
        };
        inp: {
            valueMs: number | null;
            formatted: string;
            rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A';
        };
        fcp: {
            valueMs: number | null;
            formatted: string;
            rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A';
        };
        ttfb: {
            valueMs: number | null;
            formatted: string;
            rating: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'N/A';
        };
    };
    clsHeuristicRisks?: string[];
    recommendations: string[];
}
export type SearchIntentType = 'informational' | 'commercial' | 'transactional' | 'navigational';
export interface HumanIntentKeyword {
    keyword: string;
    intent: SearchIntentType;
    relevanceScore: number;
    occurrenceCount: number;
    inTitle: boolean;
    inH1: boolean;
    inHeadings: boolean;
    intentSignal: string;
}
export interface HumanSearchQuery {
    query: string;
    intent: SearchIntentType;
    satisfactionStatus: 'fully_answered' | 'partially_answered' | 'implied';
    answerSnippet?: string;
}
export interface HumanIntentAnalysis {
    primaryIntent: SearchIntentType;
    intentDistribution: {
        informational: number;
        commercial: number;
        transactional: number;
        navigational: number;
    };
    intentAlignmentScore: number;
    topIntentKeywords: HumanIntentKeyword[];
    synthesizedHumanQueries: HumanSearchQuery[];
    minedQuestions: Array<{
        question: string;
        isAnswered: boolean;
        source: 'content' | 'inferred_need';
    }>;
    informationGainInsights: {
        hasEmpiricalData: boolean;
        hasOriginalInsights: boolean;
        repetitiveFluffScore: number;
        verdict: string;
    };
    recommendations: string[];
}
export interface ComprehensiveSeoReport {
    scannedUrl?: string;
    overallSeoScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    summary: {
        criticalIssuesCount: number;
        warningIssuesCount: number;
        passedChecksCount: number;
    };
    onpage: {
        meta: MetaTagAudit;
        openGraph: OpenGraphAudit;
        twitter: TwitterCardAudit;
        images: ImageAltAudit;
    };
    technical: {
        headings: HeadingHierarchyAudit;
        schema: SchemaOrgAudit;
        wordCount: number;
        textToHtmlRatio: number;
        isHttps?: boolean;
    };
    lighthouse: LighthouseVitalsAudit;
    humanIntent: HumanIntentAnalysis;
    prioritizedActionPlan: Array<{
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        category: 'Meta & Social' | 'Image & CLS' | 'Technical' | 'Human Intent & Content';
        action: string;
        impact: string;
    }>;
}
