/**
 * Technical SEO Auditor Tool
 * Headings hierarchy, Schema.org JSON-LD structured data, Robots.txt, Sitemap.xml & Network signals
 */
import { ParsedHtmlDocument } from '../utils/html-parser.js';
import { HeadingHierarchyAudit, SchemaOrgAudit } from '../types.js';
export interface TechnicalSeoInput {
    html?: string;
    url?: string;
    robotsTxtContent?: string;
    sitemapXmlContent?: string;
}
export interface TechnicalSeoResult {
    url?: string;
    headings: HeadingHierarchyAudit;
    schema: SchemaOrgAudit;
    contentMetrics: {
        wordCount: number;
        plainTextSizeBytes: number;
        htmlSizeBytes: number;
        textToHtmlRatio: number;
        readingTimeMinutes: number;
        thinContentWarning: boolean;
    };
    robotsTxt?: {
        fetched: boolean;
        hasSitemapDirective: boolean;
        disallowCount: number;
        raw?: string;
    };
    sitemapXml?: {
        fetched: boolean;
        totalUrlsFound: number;
        sampleUrls: string[];
    };
    summary: {
        score: number;
        criticalIssues: number;
        warnings: number;
        passedChecks: number;
    };
    recommendations: string[];
}
export declare function auditHeadingHierarchy(doc: ParsedHtmlDocument): HeadingHierarchyAudit;
export declare function auditSchemaOrg(doc: ParsedHtmlDocument): SchemaOrgAudit;
export declare function parseRobotsTxt(content: string): {
    hasSitemapDirective: boolean;
    disallowCount: number;
};
export declare function parseSitemapXml(content: string): {
    totalUrls: number;
    urls: string[];
};
export declare function auditTechnicalSeo(input: TechnicalSeoInput): Promise<TechnicalSeoResult>;
