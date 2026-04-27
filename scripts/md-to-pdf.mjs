#!/usr/bin/env node
// Convert a Markdown file to PDF using marked + Playwright Chromium.
// Usage: node scripts/md-to-pdf.mjs <input.md> <output.pdf>

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { marked } from '../node_modules/.pnpm/marked@14.0.0/node_modules/marked/lib/marked.esm.js'
import { chromium } from '../node_modules/@playwright/test/index.mjs'

const [, , inputArg, outputArg] = process.argv
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/md-to-pdf.mjs <input.md> <output.pdf>')
  process.exit(1)
}

const input = resolve(inputArg)
const output = resolve(outputArg)

const md = readFileSync(input, 'utf8')
const bodyHtml = marked.parse(md, { gfm: true, breaks: false })

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${basename(input)}</title>
<style>
  :root {
    --fg: #1f2328;
    --muted: #57606a;
    --border: #d0d7de;
    --code-bg: #f6f8fa;
    --accent: #0969da;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: var(--fg);
    line-height: 1.55;
    font-size: 11pt;
    padding: 0 4mm;
  }
  h1, h2, h3, h4 { color: var(--fg); line-height: 1.25; margin-top: 1.4em; margin-bottom: 0.5em; page-break-after: avoid; }
  h1 { font-size: 22pt; border-bottom: 2px solid var(--border); padding-bottom: 0.25em; margin-top: 0; }
  h2 { font-size: 16pt; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
  h3 { font-size: 13pt; }
  h4 { font-size: 11.5pt; }
  p, ul, ol, table, pre, blockquote { margin: 0.6em 0; }
  ul, ol { padding-left: 1.6em; }
  li + li { margin-top: 0.15em; }
  a { color: var(--accent); text-decoration: none; }
  hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    background: var(--code-bg);
    padding: 0.15em 0.35em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  pre {
    background: var(--code-bg);
    padding: 0.8em 1em;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 9.5pt;
    line-height: 1.4;
    page-break-inside: avoid;
  }
  pre code { background: transparent; padding: 0; font-size: inherit; }
  blockquote {
    margin: 0.6em 0;
    padding: 0 1em;
    color: var(--muted);
    border-left: 0.25em solid var(--border);
  }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; }
  th { background: var(--code-bg); }
  input[type=checkbox] { margin-right: 0.4em; }
  @page { size: A4; margin: 18mm 14mm; }
  @media print {
    pre, table, blockquote { page-break-inside: avoid; }
    h1, h2, h3 { page-break-after: avoid; }
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.emulateMedia({ media: 'print' })
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:8pt;color:#57606a;width:100%;padding:0 14mm;display:flex;justify-content:space-between;">' +
      `<span>${basename(input)}</span>` +
      '<span class="pageNumber"></span> / <span class="totalPages"></span>' +
      '</div>',
  })
  writeFileSync(output, pdf)
  console.log(`Wrote ${output} (${pdf.length} bytes)`)
} finally {
  await browser.close()
}
