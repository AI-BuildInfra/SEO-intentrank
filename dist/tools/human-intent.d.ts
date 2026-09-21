/**
 * Human Search Intent & Keyword Intelligence Tool
 * Identifies human search intent (Informational, Commercial, Transactional, Navigational),
 * synthesizes real user queries, mines questions, and flags AI slop/keyword stuffing.
 */
import { HumanIntentAnalysis } from '../types.js';
export interface HumanIntentInput {
    html?: string;
    text?: string;
    url?: string;
    targetKeyword?: string;
}
export declare function extractHumanIntentKeywords(input: HumanIntentInput): Promise<HumanIntentAnalysis>;
