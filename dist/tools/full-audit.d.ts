/**
 * Comprehensive All-in-One SEO Auditor Tool
 * Orchestrates on-page scan, technical audit, Lighthouse Core Web Vitals (CLS/LCP/INP),
 * and Human Intent keyword intelligence into a prioritized, actionable SEO health report.
 */
import { ComprehensiveSeoReport } from '../types.js';
export interface ComprehensiveAuditInput {
    url?: string;
    html?: string;
    apiKey?: string;
    strategy?: 'mobile' | 'desktop';
    targetKeyword?: string;
}
export declare function runComprehensiveSeoAudit(input: ComprehensiveAuditInput): Promise<ComprehensiveSeoReport>;
