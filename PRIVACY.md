# Privacy Policy for SEO-IntentRank

**Effective Date:** September 21, 2026  
**Maintained by:** AI Build Infra (https://aibuildinfra.com/)

---

## 1. Overview
SEO-IntentRank is an open-source Model Context Protocol (MCP) server providing on-page SEO diagnostic tools, Core Web Vitals assessment, and human search intent keyword analysis.

---

## 2. Information Handled
- **Target URLs & HTML**: SEO-IntentRank processes the web page URLs or raw HTML markup explicitly provided by the user or client agent to perform SEO diagnostics.
- **No Personal Data Collected**: The tool does not collect, harvest, store, or sell personal identifiable information (PII), tracking cookies, or user browsing history.
- **No Telemetry**: No background tracking or user usage telemetry is transmitted to third parties.

---

## 3. External API Services
- **Google PageSpeed Insights API**: When auditing live URLs for Core Web Vitals (CLS, LCP, INP), requests may be sent directly to Google's public PageSpeed Insights API (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`). Please refer to [Google's Privacy Policy](https://policies.google.com/privacy) for their terms.

---

## 4. Local Execution & Security
SEO-IntentRank executes locally via Node.js stdio communication. All analysis is performed within the user's local execution environment.

---

## 5. Contact & Questions
For privacy questions or security inquiries, please contact:
- **Email**: info@aibuildinfra.com
- **GitHub Issues**: https://github.com/AI-BuildInfra/SEO-intentrank/issues
