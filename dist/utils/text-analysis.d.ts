/**
 * Text analysis utilities for SEO & Search Intent classification
 */
import { SearchIntentType } from '../types.js';
export declare function tokenizeWords(text: string): string[];
export declare function extractNgrams(words: string[], n: number): Map<string, number>;
export declare function classifyIntent(phraseOrText: string): {
    intent: SearchIntentType;
    signal: string;
    confidence: number;
    score: number;
};
export declare function extractQuestionsFromText(text: string): string[];
