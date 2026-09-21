/**
 * Human Search Intent & Keyword Intelligence Tool
 * Identifies human search intent (Informational, Commercial, Transactional, Navigational),
 * synthesizes real user queries, mines questions, and flags AI slop/keyword stuffing.
 */
import { parseHtml } from '../utils/html-parser.js';
import { tokenizeWords, extractNgrams, classifyIntent, extractQuestionsFromText, } from '../utils/text-analysis.js';
export async function extractHumanIntentKeywords(input) {
    let html = input.html || '';
    let text = input.text || '';
    const url = input.url;
    if (!html && !text && url) {
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
    let doc = null;
    if (html) {
        doc = parseHtml(html);
        text = doc.plainText;
    }
    else if (!text) {
        throw new Error('Either "html", "text" content, or a valid "url" must be provided.');
    }
    const title = doc?.title || '';
    const h1 = doc?.headings.find((h) => h.level === 1)?.text || '';
    const headingTexts = doc?.headings.map((h) => h.text.toLowerCase()) || [];
    const words = tokenizeWords(text);
    const totalWordCount = Math.max(1, words.length);
    // Extract 2-grams and 3-grams
    const bigrams = extractNgrams(words, 2);
    const trigrams = extractNgrams(words, 3);
    const minCount = totalWordCount < 50 ? 1 : 2;
    // Combine phrases that occur at least minCount or are in headings/title
    const candidatePhrases = new Map();
    for (const [phrase, count] of bigrams.entries()) {
        if (count >= minCount || (title && title.toLowerCase().includes(phrase)) || (h1 && h1.toLowerCase().includes(phrase))) {
            candidatePhrases.set(phrase, count);
        }
    }
    for (const [phrase, count] of trigrams.entries()) {
        if (count >= minCount || (title && title.toLowerCase().includes(phrase)) || (h1 && h1.toLowerCase().includes(phrase))) {
            candidatePhrases.set(phrase, count);
        }
    }
    // Also include high-intent single words if few multi-word phrases found
    if (candidatePhrases.size < 5) {
        for (const w of words) {
            if (w.length > 3) {
                const { score } = classifyIntent(w);
                if (score > 0) {
                    candidatePhrases.set(w, (candidatePhrases.get(w) || 0) + 1);
                }
            }
        }
    }
    // If target keyword provided, ensure it's analyzed
    if (input.targetKeyword) {
        const kw = input.targetKeyword.toLowerCase().trim();
        const count = (text.toLowerCase().match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length;
        candidatePhrases.set(kw, count || 1);
    }
    // Rank keywords by relevance & context presence
    const intentKeywords = [];
    let totalIntentWeight = {
        informational: 0,
        commercial: 0,
        transactional: 0,
        navigational: 0,
    };
    for (const [phrase, count] of candidatePhrases.entries()) {
        const inTitle = title.toLowerCase().includes(phrase);
        const inH1 = h1.toLowerCase().includes(phrase);
        const inHeadings = headingTexts.some((ht) => ht.includes(phrase));
        const { intent, signal, confidence } = classifyIntent(phrase);
        // Relevance score: frequency weight + title/h1 bonus
        let score = (count / totalWordCount) * 10;
        if (inTitle)
            score += 0.35;
        if (inH1)
            score += 0.30;
        if (inHeadings)
            score += 0.15;
        score = Math.min(1.0, Math.max(0.1, score * confidence));
        const weight = count * (inTitle ? 3 : inH1 ? 2.5 : inHeadings ? 1.5 : 1);
        totalIntentWeight[intent] += weight;
        intentKeywords.push({
            keyword: phrase,
            intent,
            relevanceScore: Number(score.toFixed(3)),
            occurrenceCount: count,
            inTitle,
            inH1,
            inHeadings,
            intentSignal: signal,
        });
    }
    // Sort keywords by relevance
    intentKeywords.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topKeywords = intentKeywords.slice(0, 15);
    // Intent distribution percentages
    const sumWeights = totalIntentWeight.informational + totalIntentWeight.commercial + totalIntentWeight.transactional + totalIntentWeight.navigational || 1;
    const intentDistribution = {
        informational: Math.round((totalIntentWeight.informational / sumWeights) * 100),
        commercial: Math.round((totalIntentWeight.commercial / sumWeights) * 100),
        transactional: Math.round((totalIntentWeight.transactional / sumWeights) * 100),
        navigational: Math.round((totalIntentWeight.navigational / sumWeights) * 100),
    };
    // Determine primary intent
    let primaryIntent = 'informational';
    let maxWeight = totalIntentWeight.informational;
    if (totalIntentWeight.commercial > maxWeight) {
        primaryIntent = 'commercial';
        maxWeight = totalIntentWeight.commercial;
    }
    if (totalIntentWeight.transactional > maxWeight) {
        primaryIntent = 'transactional';
        maxWeight = totalIntentWeight.transactional;
    }
    if (totalIntentWeight.navigational > maxWeight) {
        primaryIntent = 'navigational';
    }
    // Synthesize real human search queries
    const synthesizedQueries = [];
    const primaryTopic = topKeywords[0]?.keyword || title || 'the topic';
    if (primaryIntent === 'informational') {
        synthesizedQueries.push({
            query: `how to ${primaryTopic}`,
            intent: 'informational',
            satisfactionStatus: 'fully_answered',
            answerSnippet: text.slice(0, 180) + '...',
        });
        synthesizedQueries.push({
            query: `what is ${primaryTopic} and how it works`,
            intent: 'informational',
            satisfactionStatus: 'fully_answered',
        });
    }
    else if (primaryIntent === 'commercial') {
        synthesizedQueries.push({
            query: `best ${primaryTopic} review and comparison`,
            intent: 'commercial',
            satisfactionStatus: 'fully_answered',
        });
        synthesizedQueries.push({
            query: `${primaryTopic} pros and cons`,
            intent: 'commercial',
            satisfactionStatus: 'partially_answered',
        });
    }
    else if (primaryIntent === 'transactional') {
        synthesizedQueries.push({
            query: `buy ${primaryTopic} pricing`,
            intent: 'transactional',
            satisfactionStatus: 'fully_answered',
        });
        synthesizedQueries.push({
            query: `get started with ${primaryTopic}`,
            intent: 'transactional',
            satisfactionStatus: 'fully_answered',
        });
    }
    else {
        synthesizedQueries.push({
            query: `${primaryTopic} login portal`,
            intent: 'navigational',
            satisfactionStatus: 'fully_answered',
        });
    }
    // Mine natural questions from text
    const rawQuestions = extractQuestionsFromText(text);
    const minedQuestions = rawQuestions.map((q) => ({
        question: q,
        isAnswered: true,
        source: 'content',
    }));
    if (minedQuestions.length === 0) {
        minedQuestions.push({
            question: `What are the core benefits of ${primaryTopic}?`,
            isAnswered: text.toLowerCase().includes('benefit') || text.toLowerCase().includes('advantage'),
            source: 'inferred_need',
        });
    }
    // Information Gain & AI Fluff analysis
    const hasNumbers = /\b\d+(\.\d+)?%?\b/.test(text);
    const hasCaseStudy = /\b(case study|experiment|data|measured|benchmark|result|tested)\b/i.test(text);
    const aiSlopPhrases = ['revolutionize', 'delve', 'tapestry', 'beacon', 'testament', 'in today\'s fast-paced world', 'game changer', 'unlock the power'];
    let slopMatches = 0;
    for (const slop of aiSlopPhrases) {
        if (new RegExp(`\\b${slop}\\b`, 'i').test(text))
            slopMatches++;
    }
    const repetitiveFluffScore = Math.min(100, slopMatches * 20);
    let informationGainVerdict = 'High Information Gain: Content includes specific data points and authentic vocabulary.';
    if (repetitiveFluffScore > 40) {
        informationGainVerdict = 'Low Information Gain: High density of generic marketing clichés / AI tropes detected.';
    }
    // Intent alignment score
    let intentAlignmentScore = 85;
    if (primaryIntent === 'informational' && intentDistribution.transactional > 40) {
        intentAlignmentScore = 55; // Sales pitch dissonance
    }
    else if (repetitiveFluffScore > 50) {
        intentAlignmentScore = 60;
    }
    const recommendations = [];
    if (primaryIntent === 'informational' && intentDistribution.transactional > 35) {
        recommendations.push('Reduce aggressive transactional sales pitches in early paragraphs to satisfy informational search intent.');
    }
    if (minedQuestions.length < 3) {
        recommendations.push('Add an FAQ section with structured FAQPage JSON-LD answering high-volume user search queries.');
    }
    if (slopMatches > 0) {
        recommendations.push(`Replace ${slopMatches} generic AI filler phrase(s) with concrete data, case studies, or first-hand experience.`);
    }
    return {
        primaryIntent,
        intentDistribution,
        intentAlignmentScore,
        topIntentKeywords: topKeywords,
        synthesizedHumanQueries: synthesizedQueries,
        minedQuestions,
        informationGainInsights: {
            hasEmpiricalData: hasNumbers,
            hasOriginalInsights: hasCaseStudy,
            repetitiveFluffScore,
            verdict: informationGainVerdict,
        },
        recommendations,
    };
}
