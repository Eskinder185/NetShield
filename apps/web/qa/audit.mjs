// Real-browser QA: screenshots + axe (incl. colour contrast) + overflow + touch-target checks.
// Usage: node qa/audit.mjs <outDir> [baseUrl] [pageFilter]
// Requires a built app served at baseUrl (npm run build && npx vite preview --port 4173) and Chrome or Edge installed.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const out = process.argv[2] ?? 'qa-out';
const base = process.argv[3] ?? 'http://127.0.0.1:4173';
const filter = process.argv[4];
mkdirSync(out, { recursive: true });

const PAGES = ['/', '/features', '/internet-doctor', '/how-it-works', '/pricing', '/scam-shield', '/contact', '/faq', '/login', '/register',
  '/demo', '/demo/internet-doctor', '/demo/devices', '/demo/protection', '/demo/scam-shield', '/demo/family', '/demo/privacy',
  '/demo/reports', '/demo/assistant', '/demo/lab', '/demo/settings'];
const VIEWPORTS = { phone: { width: 390, height: 844 }, tablet: { width: 820, height: 1180 }, desktop: { width: 1440, height: 900 } };
const THEMES = ['dark', 'light'];

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, headless: true });
const report = [];

for (const theme of THEMES) {
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size, colorScheme: theme, deviceScaleFactor: 1 });
    await ctx.addInitScript((t) => localStorage.setItem('ns-theme', t), theme);
    for (const path of PAGES.filter((p) => !filter || p.includes(filter))) {
      const page = await ctx.newPage();
      await page.route('**/api/**', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"no"}' }));
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const name = `${path === '/' ? 'home' : path.slice(1).replace(/\//g, '_')}.${vp}.${theme}`;
      if (theme === 'dark' || vp !== 'tablet') await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () => {
        const axeRes = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
        const overflow = document.documentElement.scrollWidth - window.innerWidth;
        const small = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=tab]')]
          .filter((e) => { const inline = e.tagName === 'A' && e.closest('p') && e.parentElement.textContent.trim() !== e.textContent.trim(); if (inline) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24) && !e.closest('.sr-only') && getComputedStyle(e).visibility !== 'hidden'; })
          .map((e) => `${e.tagName.toLowerCase()}"${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
        return { violations: axeRes.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.any[0]?.message ?? n.failureSummary ?? '').slice(0, 140)) })), overflow, small };
      });
      report.push({ name, ...res });
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();

let bad = 0;
for (const r of report) {
  const issues = [];
  r.violations.forEach((v) => issues.push(`axe ${v.id} (${v.impact}): ${v.nodes.join(' || ')}`));
  if (r.overflow > 1) issues.push(`horizontal overflow ${r.overflow}px`);
  if (r.small.length) issues.push(`small targets: ${r.small.slice(0, 4).join('; ')}`);
  if (issues.length) { bad++; console.log(`\n✗ ${r.name}\n  ` + issues.join('\n  ')); }
}
console.log(`\n${report.length} page/viewport/theme combinations, ${bad} with issues. Screenshots in ${out}`);
process.exit(bad ? 1 : 0);
