/**
 * Google Lighthouse Core Web Vitals & Cumulative Layout Shift (CLS) Auditor Tool
 */
import { LighthouseVitalsAudit } from '../types.js';
export interface LighthouseAuditInput {
    url?: string;
    html?: string;
    strategy?: 'mobile' | 'desktop';
    apiKey?: string;
}
export declare function auditLocalClsHeuristics(html: string): LighthouseVitalsAudit;
export declare function auditLighthouseVitals(input: LighthouseAuditInput): Promise<LighthouseVitalsAudit>;
