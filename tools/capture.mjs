// Знімки й відео програми для сайту — на демо-даних, без особистих записів.
//   node tools/capture.mjs            — скриншоти сторінок, тем і відео
//   node tools/capture.mjs shots      — лише скриншоти
// Потрібні: Chrome і ffmpeg з Remotion (../level-up-promo). Програма віддається з ../HabitTrackerApp/app.
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const SITE = path.resolve(import.meta.dirname, '..'), APP = path.resolve(SITE, '../HabitTrackerApp/app'), IMG = path.join(SITE, 'img');
const FFMPEG = path.resolve(SITE, '../level-up-promo/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['home', 'finance', 'dashboard', 'insights', 'sport', 'habits'];
export const THEMES = ['levelup', 'classic', 'nebula', 'champagne', 'amethyst', 'ice'];
const W = 1440, H = 900, only = process.argv[2];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// маленький статичний сервер для програми
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json'};
const srv = http.createServer((q, s) => {
  const f = path.join(APP, decodeURIComponent(new URL(q.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(APP) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404).end(); return; }
  s.writeHead(200, {'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream'}).end(fs.readFileSync(f));
}).listen(0);
const URL_APP = `http://localhost:${srv.address().port}/`;

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'lvl-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${prof}`, '--lang=ru', `--window-size=${W},${H}`, '--hide-scrollbars', 'about:blank']);
let list; for (let i = 0; i < 60; i++) { try { list = await (await fetch('http://127.0.0.1:9334/json/list')).json(); if (list.find(x => x.type === 'page')) break; } catch { /* ще стартує */ } await sleep(250); }
const ws = new WebSocket(list.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const wait = {}, on = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (wait[m.id]) { wait[m.id](m); delete wait[m.id]; } else if (on[m.method]) on[m.method](m.params); };
const cmd = (method, params = {}) => new Promise(r => { wait[++id] = r; ws.send(JSON.stringify({id, method, params})); });
const ev = async expr => { const r = await cmd('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error'); return r.result.result.value; };
const shot = async name => { const {result} = await cmd('Page.captureScreenshot', {format: 'webp', quality: 86}); fs.writeFileSync(path.join(IMG, name + '.webp'), Buffer.from(result.data, 'base64')); console.log('img/' + name + '.webp'); };
const page = async (p, theme = 'levelup') => { await ev(`hideModal(); S.theme = '${theme}'; applyTheme(); UI.page = '${p}'; render({nav: true}); window.scrollTo(0, 0); 1`); await sleep(1600); };

try {
  await cmd('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false});
  await cmd('Page.navigate', {url: URL_APP}); await sleep(3500);
  // демо-дані, кнопки-таблетки; без вікон згоди, опитування й «Що нового»
  await ev(`S = demoState(); S.uiStyle = 'pill'; S.errReports = false; S.survey = {done: 1}; S.seenVersion = '9.9.9'; save(); hideModal(); render({nav: true}); 1`);
  await sleep(1500);
  for (const p of PAGES) { await page(p); await shot(p); }
  // на знімках тем тор і свічки ховаємо — сайт малює їх поверх живими (logos.js)
  const rel = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return [r.x / ${W} * 100, r.y / ${H} * 100, r.width / ${W} * 100, r.height / ${H} * 100].map(v => +v.toFixed(3)); })()`;
  for (const th of THEMES) {
    await page('home', th);
    if (th === THEMES[0]) fs.writeFileSync(path.join(SITE, 'logos.js'), `// згенеровано tools/capture.mjs: місце тора й свічок на знімку, % від ${W}×${H}
window.LOGOS = ${JSON.stringify({torus: await ev(rel('#torus')), candles: await ev(rel('.candles'))})};
`);
    await ev(`document.querySelectorAll('#torus, .candles').forEach(e => e.style.visibility = 'hidden'); 1`);
    await shot('theme-' + th);
  }

  if (only !== 'shots') {
    // відео ~14 с: відмітити звички (росте XP) → фінанси → дашборд → інша тема
    await page('home');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvl-frames-')), frames = [];
    on['Page.screencastFrame'] = p => { const f = path.join(dir, `f${String(frames.length).padStart(4, '0')}.jpg`); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({f, t: p.metadata.timestamp}); cmd('Page.screencastFrameAck', {sessionId: p.sessionId}); };
    await cmd('Page.startScreencast', {format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1});
    // кадри приходять лише при змінах — тримаємо сторінку «живою», щоб паузи теж записались
    await ev(`window.__tick = setInterval(() => document.body.style.outlineColor = document.body.style.outlineColor ? '' : 'transparent', 40); 1`);
    await sleep(1600);
    for (let i = 0; i < 3; i++) { await ev(`(() => { const c = [...document.querySelectorAll('#page .tcheck[data-act=toggle]')].find(x => !x.classList.contains('on')); if (c) c.click(); return !!c; })()`); await sleep(900); }
    await sleep(800);
    await page('finance'); await sleep(1600);
    await page('dashboard'); await sleep(1600);
    await page('home', 'nebula'); await sleep(1400);
    await page('home', 'champagne'); await sleep(1400);
    await cmd('Page.stopScreencast'); await ev(`clearInterval(window.__tick); 1`);
    // кадри зі змінною тривалістю → mp4 (H.264)
    const list = frames.map((x, i) => `file '${x.f.replace(/\\/g, '/')}'\nduration ${((frames[i + 1]?.t ?? x.t + 0.04) - x.t).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1).f.replace(/\\/g, '/')}'\n`;
    fs.writeFileSync(path.join(dir, 'list.txt'), list);
    const base = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-fps_mode', 'cfr', '-r', '30', '-an'];
    execFileSync(FFMPEG, [...base, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', path.join(IMG, 'demo.mp4')]);
    fs.copyFileSync(path.join(IMG, 'home.webp'), path.join(IMG, 'demo-poster.webp'));
    console.log(`img/demo.mp4 (${frames.length} кадрів)`);
    fs.rmSync(dir, {recursive: true, force: true});
  }
} finally { ws.close(); chrome.kill(); srv.close(); }
