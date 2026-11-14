// node tools/pages.mjs — головна трьома мовами з текстами прямо в HTML (для пошуковиків):
//   index.html (ru, «/»), uk/index.html, en/index.html + sitemap.xml з hreflang.
// Тексти правити в об'єкті L в index.html, потім запустити цей скрипт. index.html — і джерело, і російська сторінка.
import fs from 'node:fs';
import path from 'node:path';
import {LANDING, buildLanding} from './landing.mjs';

const SITE = path.resolve(import.meta.dirname, '..'), URL0 = 'https://levelup-tracker.com';
const PAGES = {ru: '/', uk: '/uk/', en: '/en/'}, LOCALE = {ru: 'ru_RU', uk: 'uk_UA', en: 'en_US'};
const DOCS = ['about.html', 'terms.html', 'privacy.html', 'contact.html', 'news.html'];

const src = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const lit = src.match(/\nconst L = (\{[\s\S]*?\}\});\n/);
if (!lit) throw new Error('не знайшов const L = {...}; в index.html');
const L = new Function(`return ${lit[1]}`)();
const esc = v => String(v).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// self-check: у кожної мови ті самі ключі, і кожен data-i є в L
const keys = Object.keys(L.ru);
for (const l of Object.keys(PAGES)) { const miss = keys.filter(k => !(k in L[l])).concat(Object.keys(L[l]).filter(k => !(k in L.ru))); if (miss.length) throw new Error(`${l}: розходяться ключі ${miss.join(', ')}`); }
const used = [...src.matchAll(/data-i="([^"]+)"/g)].map(m => m[1]).filter(k => !(k in L.ru));
if (used.length) throw new Error('немає в L: ' + [...new Set(used)].join(', '));

// Google: програма для Windows, безкоштовна; питання й відповіді — з розділу «Питання» (ключі a1, a1d…)
const ldJson = (l, p, T) => JSON.stringify([
  {'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'LEVEL UP', operatingSystem: 'Windows 10, Windows 11', applicationCategory: 'LifestyleApplication', description: T.mD, url: URL0 + p, inLanguage: l, image: URL0 + '/img/og.png', offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}},
  {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: Object.keys(T).filter(k => /^a\d+$/.test(k)).map(k => ({'@type': 'Question', name: T[k], acceptedAnswer: {'@type': 'Answer', text: T[k + 'd']}}))},
]).replace(/</g, '\\u003c');
const LAND_SRC = {'trekker-privychek': 'habits', 'uchet-rashodov': 'money'};   // у підвалі головної — посилання на сторінки під запити мовою сторінки
const alt =Object.entries(PAGES).map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${URL0}${p}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${URL0}/en/">`;
for (const [l, p] of Object.entries(PAGES)) {
  const T = L[l];
  let s = src
    // тексти в елементах з data-i (data-html — з розміткою)
    .replace(/(<(\w+)\b[^>]*\bdata-i="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (m, open, tag, k, close) => open + (/\bdata-html\b/.test(open) ? T[k] : esc(T[k])) + close)
    .replace(/<html lang="[^"]*">/, `<html lang="${l}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(T.mT)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(T.mD)}`)
    .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(T.oT)}`)
    .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(T.oD)}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${URL0}${p}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${URL0}${p}`)
    .replace(/\n<meta property="og:locale"[^\n]*/g, '').replace(/\n<link rel="alternate" hreflang[^\n]*/g, '')
    .replace(/(<link rel="canonical"[^\n]*)/, `$1\n${alt}\n<meta property="og:locale" content="${LOCALE[l]}">`)
    .replace(/(["`(])\/img\/(ru|uk|en)\//g, `$1/img/${l}/`)   // знімки програми мовою сторінки
    .replace(/\n<script type="application\/ld\+json">[^\n]*/g, '')
    .replace(/(<meta property="og:locale"[^\n]*)/, `$1\n<script type="application/ld+json">${ldJson(l, p, T)}</script>`)
    .replace(/href="\/(?:uk\/|en\/)?([a-z-]+)\.html"/g, (m, f) => { const id = LAND_SRC[f] || Object.keys(LANDING).find(k => Object.values(LANDING[k]).some(u => u.endsWith('/' + f + '.html'))); return id ? `href="${LANDING[id][l]}"` : m; })
    .replace(/(<a [^>]*data-l="(\w+)"[^>]*?)( class="on")?>/g, (m, a, dl) => a + (dl === l ? ' class="on"' : '') + '>');
  if (/data-i="[^"]+"[^>]*><\/(h1|h2|p|span|li|summary)>/.test(s)) throw new Error(l + ': лишився порожній текст');
  const out = path.join(SITE, p, 'index.html');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, s);
  console.log(path.relative(SITE, out), '—', T.mT);
}

// sitemap: три мови головної з посиланнями одна на одну + документи
const links = Object.entries(PAGES).map(([l, p]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${URL0}${p}"/>`).join('\n');
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.values(PAGES).map(p => `  <url><loc>${URL0}${p}</loc>\n${links}\n  </url>`).join('\n')}
${DOCS.map(d => `  <url><loc>${URL0}/${d}</loc></url>`).join('\n')}
${Object.values(LANDING).map(P => Object.values(P).map(u => `  <url><loc>${URL0}${u}</loc>\n${Object.entries(P).map(([k, x]) => `    <xhtml:link rel="alternate" hreflang="${k}" href="${URL0}${x}"/>`).join('\n')}\n  </url>`).join('\n')).join('\n')}
</urlset>
`);
console.log('sitemap.xml');
buildLanding(SITE);
