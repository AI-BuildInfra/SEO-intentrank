import { runComprehensiveSeoAudit } from './dist/tools/full-audit.js';

async function main() {
  const url = 'https://superstrikersinternational.com/';
  console.log(`Running comprehensive SEO & IntentRank audit on ${url}...`);
  try {
    const report = await runComprehensiveSeoAudit({ url });
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('Audit error:', err);
  }
}

main();
