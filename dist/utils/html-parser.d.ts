/**
 * High-performance, zero-dependency HTML parser for SEO audits.
 */
export interface ParsedMetaTag {
    name?: string;
    property?: string;
    content?: string;
    httpEquiv?: string;
    charset?: string;
    raw: string;
}
export interface ParsedLinkTag {
    rel?: string;
    href?: string;
    hreflang?: string;
    raw: string;
}
export interface ParsedImageTag {
    src: string;
    alt: string | null;
    width?: string;
    height?: string;
    loading?: string;
    raw: string;
}
export interface ParsedHeadingTag {
    level: number;
    text: string;
}
export interface ParsedHtmlDocument {
    title: string | null;
    metas: ParsedMetaTag[];
    links: ParsedLinkTag[];
    images: ParsedImageTag[];
    headings: ParsedHeadingTag[];
    jsonLdScripts: string[];
    plainText: string;
    htmlSizeBytes: number;
    textSizeBytes: number;
}
export declare function decodeHtmlEntities(str: string): string;
export declare function parseHtml(html: string): ParsedHtmlDocument;
