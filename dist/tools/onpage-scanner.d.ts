/**
 * On-Page SEO Scanner Tool
 * Meta Title, Description, Open Graph, Twitter Cards, Canonical, Hreflang, Image Alt Tags & Layout Shift Dimensions
 */
import { ParsedHtmlDocument } from '../utils/html-parser.js';
import { MetaTagAudit, OpenGraphAudit, TwitterCardAudit, ImageAltAudit } from '../types.js';
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
        score: number;
    };
    recommendations: string[];
}
export declare function scanMetaTags(doc: ParsedHtmlDocument, baseUrl?: string): MetaTagAudit;
export declare function scanOpenGraph(doc: ParsedHtmlDocument): OpenGraphAudit;
export declare function scanTwitterCard(doc: ParsedHtmlDocument): TwitterCardAudit;
export declare function scanImageAltTags(doc: ParsedHtmlDocument): ImageAltAudit;
export declare function scanOnPageSeo(input: OnPageScanInput): Promise<OnPageScanResult>;
