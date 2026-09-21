/**
 * Text analysis utilities for SEO & Search Intent classification
 */
const STOP_WORDS = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
    'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
    'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
    'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
    'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should',
    'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them',
    'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d',
    'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s',
    'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
    'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);
const INFORMATIONAL_TRIGGERS = [
    'how', 'what', 'why', 'when', 'where', 'who', 'guide', 'tutorial', 'definition', 'overview',
    'explained', 'tips', 'learn', 'understand', 'steps', 'process', 'examples', 'meaning', 'history',
    'strategy', 'framework', 'complete guide', 'introduction', 'basics', 'concept', 'checklist'
];
const COMMERCIAL_TRIGGERS = [
    'best', 'top', 'vs', 'versus', 'review', 'reviews', 'comparison', 'alternative', 'alternatives',
    'pros and cons', 'features', 'rated', 'benchmark', 'ranking', 'tool', 'tools', 'software',
    'selection', 'criteria', 'worth it', 'evaluation'
];
const TRANSACTIONAL_TRIGGERS = [
    'buy', 'pricing', 'price', 'discount', 'coupon', 'hire', 'order', 'quote', 'free trial',
    'get started', 'sign up', 'purchase', 'demo', 'contact', 'schedule', 'book', 'download now',
    'subscribe', 'shop', 'sale', 'cheap', 'affordable', 'cost'
];
const NAVIGATIONAL_TRIGGERS = [
    'login', 'sign in', 'log in', 'portal', 'account', 'dashboard', 'official', 'support',
    'customer care', 'app download', 'platform login', 'client area', 'admin'
];
export function tokenizeWords(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1);
}
export function extractNgrams(words, n) {
    const ngrams = new Map();
    for (let i = 0; i <= words.length - n; i++) {
        const chunk = words.slice(i, i + n);
        // Ignore chunks starting or ending with stopwords
        if (STOP_WORDS.has(chunk[0]) || STOP_WORDS.has(chunk[chunk.length - 1])) {
            continue;
        }
        const phrase = chunk.join(' ');
        ngrams.set(phrase, (ngrams.get(phrase) || 0) + 1);
    }
    return ngrams;
}
export function classifyIntent(phraseOrText) {
    const text = phraseOrText.toLowerCase();
    let infoScore = 0;
    let commScore = 0;
    let transScore = 0;
    let navScore = 0;
    for (const trigger of INFORMATIONAL_TRIGGERS) {
        if (new RegExp(`\\b${trigger}\\b`, 'i').test(text))
            infoScore += 2;
    }
    for (const trigger of COMMERCIAL_TRIGGERS) {
        if (new RegExp(`\\b${trigger}\\b`, 'i').test(text))
            commScore += 2.5;
    }
    for (const trigger of TRANSACTIONAL_TRIGGERS) {
        if (new RegExp(`\\b${trigger}\\b`, 'i').test(text))
            transScore += 3;
    }
    for (const trigger of NAVIGATIONAL_TRIGGERS) {
        if (new RegExp(`\\b${trigger}\\b`, 'i').test(text))
            navScore += 3;
    }
    const scores = [
        { intent: 'transactional', score: transScore, trigger: 'High-conversion buying signals / pricing / signup triggers' },
        { intent: 'commercial', score: commScore, trigger: 'Evaluation, review, or comparison modifiers' },
        { intent: 'navigational', score: navScore, trigger: 'Brand navigation / portal / login indicators' },
        { intent: 'informational', score: infoScore, trigger: 'Exploratory question or educational terminology' },
    ];
    scores.sort((a, b) => b.score - a.score);
    if (scores[0].score === 0) {
        // Default to informational if general topic
        return {
            intent: 'informational',
            signal: 'General topical and contextual subject matter',
            confidence: 0.5,
            score: 0,
        };
    }
    return {
        intent: scores[0].intent,
        signal: scores[0].trigger,
        confidence: Math.min(1.0, 0.5 + scores[0].score * 0.1),
        score: scores[0].score,
    };
}
export function extractQuestionsFromText(text) {
    const questions = [];
    // Match sentences ending with '?'
    const questionRegex = /([A-Z][^.!?\n\r]*\?)/g;
    let match;
    while ((match = questionRegex.exec(text)) !== null) {
        const q = match[1].replace(/\s+/g, ' ').trim();
        if (q.length >= 10 && q.length <= 150) {
            questions.push(q);
        }
    }
    return [...new Set(questions)].slice(0, 10);
}
