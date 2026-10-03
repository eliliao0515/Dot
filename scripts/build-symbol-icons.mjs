#!/usr/bin/env node
/**
 * 從 Ionicons 的 SVG 檔產生 src/content/symbols/icons.generated.ts，以及給使用者審的對照頁。
 *
 * 用法：
 *   npm pack ionicons && tar xzf ionicons-*.tgz
 *   node scripts/build-symbol-icons.mjs package/dist/svg
 *
 * 只會產生 src/content/symbols/symbols.ts 裡有列到的圖示。
 * Ionicons 是 MIT 授權（src/content/symbols/IONICONS-LICENSE.txt），App 不需要在執行時連網下載。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const svgDir = process.argv[2];
if (!svgDir || !existsSync(svgDir)) {
  console.error('請給 Ionicons 的 svg 資料夾路徑，例如 package/dist/svg');
  process.exit(1);
}

const symbolsSrc = readFileSync('src/content/symbols/symbols.ts', 'utf8');
const entries = [...symbolsSrc.matchAll(/\{ id: '([^']+)', icon: '([^']+)', name: '([^']+)', meaning: '([^']+)', ask: '([^']+)'(?:, group: '([^']+)')? \}/g)].map(
  (m) => ({ id: m[1], icon: m[2], name: m[3], meaning: m[4], ask: m[5], group: m[6] }),
);
const icons = [...new Set(entries.map((e) => e.icon))];

const svgs = {};
for (const name of icons) {
  const file = join(svgDir, `${name}.svg`);
  if (!existsSync(file)) {
    console.error(`找不到 ${file}`);
    process.exit(1);
  }
  // 去掉 class 屬性，顏色保留 currentColor，顯示時再換成要的顏色。
  // 有些形狀沒寫 fill（預設黑色），在最外層補 fill="currentColor"，換顏色時才換得到。
  svgs[name] = readFileSync(file, 'utf8')
    .trim()
    .replace(/ class="ionicon"/, '')
    .replace(/^<svg /, '<svg fill="currentColor" ');
}

const ts = `// 由 scripts/build-symbol-icons.mjs 產生，不要手改。
// 圖示來源：Ionicons（MIT 授權，見 IONICONS-LICENSE.txt）。
export const ICON_SVGS: Record<string, string> = ${JSON.stringify(svgs, null, 2)};
`;
writeFileSync('src/content/symbols/icons.generated.ts', ts);

// 給使用者審的對照頁
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rows = entries
  .map(
    (e, i) => `<tr><td class="n">${i + 1}</td><td class="icon">${svgs[e.icon].replace(/currentColor/g, '#1C1C1E')}</td>
<td><b>${esc(e.name)}</b>${e.group ? `<div class="g">同組：${esc(e.group)}</div>` : ''}</td><td>${esc(e.meaning)}</td><td>${esc(e.ask)}</td></tr>`,
  )
  .join('\n');
const html = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>符號圖庫審核</title><style>
body{font-family:-apple-system,"PingFang TC","Noto Sans TC",sans-serif;margin:16px;color:#16202B;background:#F2F2F7}
h1{font-size:22px}p{color:#3E4A55}table{border-collapse:collapse;background:#fff;width:100%}
td,th{border:1px solid #D1D1D6;padding:8px;vertical-align:middle;font-size:15px;text-align:left}
th{background:#E4EDF3}.icon svg{width:40px;height:40px}.n{color:#3E4A55;width:28px}.g{font-size:12px;color:#3E4A55;margin-top:4px}
</style></head><body><h1>符號圖庫審核（${entries.length} 個，草稿）</h1>
<p>名稱會出現在選項上；說明在答完題目後顯示；題目用在「看意思選圖」。同組的符號意思接近，出題時不會同時當選項。</p>
<table><tr><th>#</th><th>圖示</th><th>名稱</th><th>按下去會怎樣（說明）</th><th>看意思選圖的題目</th></tr>
${rows}</table><p>圖示來源：Ionicons（MIT 授權）。</p></body></html>`;
writeFileSync('specs/v2/P4b-symbols-review.html', html);

console.log(`產生 ${icons.length} 個圖示、${entries.length} 筆符號`);
