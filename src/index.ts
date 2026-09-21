#!/usr/bin/env node

/**
 * SEO-IntentRank MCP Server
 * Official Model Context Protocol Server for Human Search Intent Keywords,
 * On-Page & Technical SEO, and Google Lighthouse Core Web Vitals (CLS/LCP/INP).
 * Maintained by AI Build Infra (https://aibuildinfra.com/)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { scanOnPageSeo, OnPageScanInput } from './tools/onpage-scanner.js';
import { auditLighthouseVitals, LighthouseAuditInput } from './tools/lighthouse-cls.js';
import { auditTechnicalSeo, TechnicalSeoInput } from './tools/technical-seo.js';
import { extractHumanIntentKeywords, HumanIntentInput } from './tools/human-intent.js';
import { runComprehensiveSeoAudit, ComprehensiveAuditInput } from './tools/full-audit.js';

const server = new Server(
  {
    name: 'io.github.AI-BuildInfra/SEO-intentrank',
    version: '1.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'scan_onpage_seo',
        description: 'Scans On-Page SEO elements from a live URL or HTML string: Meta title length/pixel width, Meta description, Open Graph tags, Twitter Cards, Canonical tags, and Image Alt tags (with missing width/height CLS checks).',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Live web page URL to fetch and audit.',
            },
            html: {
              type: 'string',
              description: 'Raw HTML markup string to audit offline.',
            },
          },
        },
      },
      {
        name: 'audit_lighthouse_cls_vitals',
        description: 'Audits Cumulative Layout Shift (CLS) score and Core Web Vitals (LCP, INP, FCP, TTFB, Lighthouse Performance/SEO scores) directly via Google Lighthouse / PageSpeed API and local DOM shift heuristics.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Live web page URL to audit with Google Lighthouse.',
            },
            html: {
              type: 'string',
              description: 'Raw HTML markup for local DOM-based layout shift and CLS heuristic calculation.',
            },
            strategy: {
              type: 'string',
              enum: ['mobile', 'desktop'],
              description: 'Device simulation strategy for Lighthouse (defaults to mobile).',
            },
            apiKey: {
              type: 'string',
              description: 'Optional Google PageSpeed Insights API key for higher rate limits.',
            },
          },
        },
      },
      {
        name: 'audit_technical_seo',
        description: 'Audits Technical SEO foundations: H1-H6 heading hierarchy (single H1, non-sequential skip detection), Schema.org JSON-LD structured data validation, Robots.txt directives, Sitemap.xml detection, and text-to-HTML ratio.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Live web page URL to audit.',
            },
            html: {
              type: 'string',
              description: 'Raw HTML markup string to audit.',
            },
            robotsTxtContent: {
              type: 'string',
              description: 'Optional raw robots.txt content to parse and validate.',
            },
            sitemapXmlContent: {
              type: 'string',
              description: 'Optional raw sitemap.xml content to parse and validate.',
            },
          },
        },
      },
      {
        name: 'extract_human_intent_keywords',
        description: 'Extracts Human Search Intent Keywords from content, classifies intent (Informational, Commercial, Transactional, Navigational), synthesizes natural human search queries, mines answered questions, and detects AI slop / keyword stuffing.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Live web page URL to analyze.',
            },
            html: {
              type: 'string',
              description: 'Raw HTML markup string.',
            },
            text: {
              type: 'string',
              description: 'Plain text or article copy to analyze.',
            },
            targetKeyword: {
              type: 'string',
              description: 'Optional primary target focus keyword to evaluate context relevance.',
            },
          },
        },
      },
      {
        name: 'comprehensive_seo_audit',
        description: 'Runs an all-in-one comprehensive SEO audit combining On-Page metadata, Open Graph/Twitter, Image Alt tags, Lighthouse CLS & Core Web Vitals, Technical Schema/Headings, and Human Intent Keywords into a single prioritized report with scores and action steps.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Live web page URL to audit.',
            },
            html: {
              type: 'string',
              description: 'Raw HTML markup string to audit offline.',
            },
            strategy: {
              type: 'string',
              enum: ['mobile', 'desktop'],
              description: 'Lighthouse audit device strategy.',
            },
            apiKey: {
              type: 'string',
              description: 'Optional Google PageSpeed Insights API key.',
            },
            targetKeyword: {
              type: 'string',
              description: 'Optional target focus keyword.',
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'scan_onpage_seo': {
        const result = await scanOnPageSeo((args as unknown as OnPageScanInput) || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'audit_lighthouse_cls_vitals': {
        const result = await auditLighthouseVitals((args as unknown as LighthouseAuditInput) || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'audit_technical_seo': {
        const result = await auditTechnicalSeo((args as unknown as TechnicalSeoInput) || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'extract_human_intent_keywords': {
        const result = await extractHumanIntentKeywords((args as unknown as HumanIntentInput) || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'comprehensive_seo_audit': {
        const result = await runComprehensiveSeoAudit((args as unknown as ComprehensiveAuditInput) || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error?.message || String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('SEO-IntentRank MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error running SEO-IntentRank MCP Server:', error);
  process.exit(1);
});
