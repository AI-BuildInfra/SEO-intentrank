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

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Regex to match key="value", key='value', or key=value or key
  const attrRegex = /([a-zA-Z0-9_\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = decodeHtmlEntities(value);
  }

  return attrs;
}

export function parseHtml(html: string): ParsedHtmlDocument {
  const htmlSizeBytes = Buffer.byteLength(html, 'utf8');

  // Extract <title>
  let title: string | null = null;
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract <meta> tags
  const metas: ParsedMetaTag[] = [];
  const metaRegex = /<meta\s+([^>]*?)\/?>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRegex.exec(html)) !== null) {
    const attrs = parseAttributes(metaMatch[1]);
    metas.push({
      name: attrs['name']?.toLowerCase(),
      property: attrs['property']?.toLowerCase(),
      content: attrs['content'],
      httpEquiv: attrs['http-equiv']?.toLowerCase(),
      charset: attrs['charset']?.toLowerCase(),
      raw: metaMatch[0],
    });
  }

  // Extract <link> tags
  const links: ParsedLinkTag[] = [];
  const linkRegex = /<link\s+([^>]*?)\/?>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const attrs = parseAttributes(linkMatch[1]);
    links.push({
      rel: attrs['rel']?.toLowerCase(),
      href: attrs['href'],
      hreflang: attrs['hreflang']?.toLowerCase(),
      raw: linkMatch[0],
    });
  }

  // Extract <img> tags
  const images: ParsedImageTag[] = [];
  const imgRegex = /<img\s+([^>]*?)\/?>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const attrs = parseAttributes(imgMatch[1]);
    images.push({
      src: attrs['src'] || attrs['data-src'] || '',
      alt: 'alt' in attrs ? attrs['alt'] : null,
      width: attrs['width'],
      height: attrs['height'],
      loading: attrs['loading']?.toLowerCase(),
      raw: imgMatch[0],
    });
  }

  // Extract Headings H1 - H6
  const headings: ParsedHeadingTag[] = [];
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const level = parseInt(headingMatch[1], 10);
    // Strip nested tags in heading
    const cleanText = decodeHtmlEntities(headingMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    if (cleanText.length > 0) {
      headings.push({
        level,
        text: cleanText,
      });
    }
  }

  // Extract JSON-LD Scripts
  const jsonLdScripts: string[] = [];
  const jsonLdRegex = /<script\s+[^>]*?type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch: RegExpExecArray | null;
  while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
    const scriptContent = jsonMatch[1].trim();
    if (scriptContent) {
      jsonLdScripts.push(scriptContent);
    }
  }

  // Extract Plain Text (strip scripts, styles, noscript, tags)
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const plainText = decodeHtmlEntities(cleanHtml);
  const textSizeBytes = Buffer.byteLength(plainText, 'utf8');

  return {
    title,
    metas,
    links,
    images,
    headings,
    jsonLdScripts,
    plainText,
    htmlSizeBytes,
    textSizeBytes,
  };
}
