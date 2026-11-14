// Знімки й відео програми для сайту — на демо-даних, без особистих записів.
//   node tools/capture.mjs            — усе: головна, фрагменти розділів LVL 2–4, відео тем (LVL 5), відео «Закритий день» (LVL 1)
//   node tools/capture.mjs shots|lvl|game|themes — лише одну частину (themes — відео тем із живими фонами, LVL 5)
// Потрібні: Chrome і ffmpeg з Remotion (../level-up-promo). Програма віддається з ../HabitTrackerApp/app.
import {spawn, execFileSync} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const SITE = path.resolve(import.meta.dirname, '..'), APP = path.resolve(SITE, '../HabitTrackerApp/app'), IMG = path.join(SITE, 'img');
const FFMPEG = path.resolve(SITE, '../level-up-promo/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGES = ['home'];   // перший екран сайту
export const THEMES = ['levelup', 'night', 'nebula', 'pluto', 'champagne', 'gold'];   // темні теми, відкриті з початку (classic, amethyst, ice у програмі більше немає)
// живий фон у відео «Під себе» — завжди «Level Up» (кристали), у темах кольору теми: [фон, колір] ('' — природний, 'acc' — колір теми)
const THEME_BG = Object.fromEntries(THEMES.map(th => [th, ['levelup', th === 'levelup' ? '' : 'acc']]));
// у відео тема триває THEME_SEC, сусідні перетікають одна в одну за THEME_FADE; кінець плавно переходить у початок (безшовний повтор).
// Ті самі числа — TH_SEC і TH_FADE в index.html (підсвітка кнопок тем)
const THEME_SEC = 2.4, THEME_FADE = 0.6;
const FFMPEG_FULL = 'ffmpeg';   // системний ffmpeg (winget install Gyan.FFmpeg): у ffmpeg з Remotion немає переходу xfade
const LANGS = ['ru', 'uk', 'en'];   // знімки кладуться в img/<мова>/ — сайт показує ті, що мовою відвідувача
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
const ev = async expr => { const r = await cmd('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true}); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
const shot = async name => { const {result} = await cmd('Page.captureScreenshot', {format: 'webp', quality: 86}); fs.writeFileSync(path.join(IMG, name + '.webp'), Buffer.from(result.data, 'base64')); console.log('img/' + name + '.webp'); };
// фрагмент: об'єднання верхніх карток сторінки, у 1.5× для чіткості
const crop = async (name, from, to) => {
  const r = await ev(`(() => { const c = [...document.querySelectorAll('#page .card')].filter(e => !e.parentElement.closest('.card')).slice(${from}, ${to}).map(e => e.getBoundingClientRect());
    const x = Math.min(...c.map(r => r.left)) - 12, y = Math.max(0, Math.min(...c.map(r => r.top)) - 12), b = Math.max(...c.map(r => r.bottom));
    const next = Math.min(Infinity, ...[...document.querySelectorAll('#page .card')].map(e => e.getBoundingClientRect().top).filter(t => t > b - 1));   // низ — не заходить на наступну картку
    return [x, y, Math.max(...c.map(r => r.right)) + 12 - x, Math.min(b + 12, next - 4) - y]; })()`);
  const m = await cmd('Page.captureScreenshot', {format: 'webp', quality: 86, captureBeyondViewport: true, clip: {x: r[0], y: r[1], width: r[2], height: r[3], scale: 1.5}}), result = m.result; if (!result) throw new Error(name + ' ' + JSON.stringify(r) + ' ' + JSON.stringify(m.error));
  fs.writeFileSync(path.join(IMG, name + '.webp'), Buffer.from(result.data, 'base64')); console.log('img/' + name + '.webp');
};
const setup = async l => { await cmd('Page.navigate', {url: URL_APP}); await sleep(3500); await ev(`__seed(13); setLang('${l}'); S = demoState(); S.lang = LANG; UI.sofia = null; S.uiStyle = 'pill'; S.errReports = false; S.survey = {done: 1}; S.seenVersion = '9.9.9'; S.es.level0 = 'A1'; document.documentElement.classList.add('noxp'); S.lastBackupAt = Date.now(); { const tk = keyOf(new Date()); S.checks[tk] = {}; S.habits.forEach((h, i) => { if (![5, 6, 7].includes(i)) S.checks[tk][h.id] = 1; }); } UI.tdKeep = {}; S.habits.slice(0, 2).forEach(h => UI.tdKeep[h.id] = 1); S.rw = {...(S.rw || {}), live: 'levelup', fx: {levelup: {den: 2, spd: 1.2}}}; { const rw = rwSet; window.rwSet = () => new Set([...rw(), 'bglive', 'bg:stars']); } S.cardStyle = 'glass';   // скляні картки на живому фоні «Level Up» — як у відео (живий фон відкривається на вищому рівні — у демо вмикаємо)
  save(); hideModal(); UI.welcome = false; YD = buildYear(S.year); render({nav: true}); 1`); await sleep(1500); };
const page = async (p, theme = 'levelup') => { await ev(`hideModal(); S.theme = '${theme}'; applyTheme(); UI.page = '${p}'; render({nav: true}); window.scrollTo(0, 0); 1`); await sleep(1600); };

try {
  await cmd('Emulation.setDeviceMetricsOverride', {width: W, height: H, deviceScaleFactor: 1, mobile: false});
  // на знімках завжди ранок 10:30 (привітання й фраза дня збігаються) і без спливних повідомлень
  await cmd('Page.enable');
  await cmd('Page.addScriptToEvaluateOnNewDocument', {source: `(() => { const R = Date, d = new R(), off = new R(d.getFullYear(), d.getMonth(), d.getDate(), 10, 30) - R.now();
    let sd = 13; window.__seed = n => sd = n; Math.random = () => { sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };   // одні й ті самі демо-дані щоразу
    window.Date = class extends R { constructor(...a) { super(...(a.length ? a : [R.now() + off])); } static now() { return R.now() + off; } };
    addEventListener('DOMContentLoaded', () => document.head.insertAdjacentHTML('beforeend', '<style>#toast,#fx-notes{display:none!important}html.noxp .fx-xp{display:none!important}</style>')); })()`});
  await cmd('Page.navigate', {url: URL_APP}); await sleep(3500);
  if (!only || only === 'shots') for (const l of LANGS) {
    // демо-дані мовою l, кнопки-таблетки; без вікон згоди, опитування й «Що нового»
    fs.mkdirSync(path.join(IMG, l), {recursive: true});
    await setup(l);
    for (const p of PAGES) { await page(p); await shot(`${l}/${p}`); }
  }

  if (!only || only === 'lvl') for (const l of LANGS) {
    // по одному крупному фрагменту на розділ сайту: LVL2 здоров'я, LVL3 гроші й трейдинг, LVL4 швидкий ввід (ШІ), LVL5 налаштування під себе
    await setup(l);
    await ev(`{ const k = keyOf(new Date()); S.health.days[k] = {...S.health.days[k], bed: '22:55', wake: '07:05', water: 6, coffee: 2, mood: 4, en: 4}; } S.fin.cats.forEach(c => { if (c.limit) c.limit = Math.round(c.limit * 1.15); }); save(); 1`);   // гарний, але не ідеальний день: видно і виконане, і ні; ліміти з запасом — без червоного «понад ліміт»
    // «склянка 250 мл · 1,5 л» у вузькій колонці рвалося на три рядки з самотнім «л»
    await page('health'); await ev(`document.head.insertAdjacentHTML('beforeend', '<style>.lbl small{white-space:nowrap}</style>'); 1`); await crop(`${l}/lvl2`, 0, 7);
    // «Спорт» — тиждень тренувань (пункт LVL 2 про спорт)
    // без рядка запису й кнопок під ним: підсумок тижня й графік по днях на всю ширину
    await ev(`UI.fx = {...(UI.fx || {}), srec: 1}; 1`); await page('sport'); await ev(`{ const c = [...document.querySelectorAll('#page .card')].filter(e => !e.parentElement.closest('.card'))[1], n = c.nextElementSibling; if (n && !n.classList.contains('card')) n.remove(); c.remove(); const top = [...document.querySelectorAll('#page .card')].filter(e => !e.parentElement.closest('.card')), h = top[2]; h.parentElement.style.gridTemplateColumns = '1fr'; h.remove(); document.querySelectorAll('.sp-gb').forEach(e => e.style.maxWidth = 'none'); document.querySelectorAll('.sp-rec')[3].remove(); } 1`); await crop(`${l}/lvl2b`, 0, 4);   // історію прибрано: у вузькій колонці «6:10 хв/км» рвалося на два рядки
    // назва категорії в один рядок («Жильё и коммуналка» в програмі переноситься)
    await page('finance'); await ev(`document.querySelectorAll('.fm-cat').forEach(e => e.style.gridTemplateColumns = '22px minmax(80px,190px) 1fr 80px'); 1`); await crop(`${l}/lvl3`, 0, 4);
    // «Капітал» з графіком росту по місяцях (трейдинг на головній не показуємо — ним користуються не всі)
    // у кадрі — загальний капітал і графік по місяцях; «Де лежать гроші» й «Цілі» прибрано, щоб не розтягувати кадр
    await ev(`UI.fin = 'capital'; UI.fx = {...(UI.fx || {}), cdyn: 1}; 1`); await page('finance'); await ev(`document.querySelector('#page .fm-two').remove(); 1`); await crop(`${l}/lvl3b`, 0, 2);
    await ev(`UI.fin = 'budget'; 1`);
    // фраза з підказки поля → розібрані записи (звичайний розборщик, без ключа ШІ); «Зарядка» — готова звичка з вибору, у демо її додано
    await ev(`{ const nm = t('hp.morning'); if (!hpHave(nm)) S.habits.push({id: uid(), name: nm, color: PALETTE[S.habits.length % PALETTE.length], icon: 'ti:sunrise'});
      const tx = t('qkPh', {c: qkEx()}).replace(/^\\S+ /, '').replace(/ · /g, ', '); UI.qk = {text: tx, res: parseQuickAll(tx)}; } 1`);
    await page('home'); await crop(`${l}/lvl4`, 1, 2);   // лише поле: нова звичка без історії знижує відсотки й серію в шапці
  }

  if (!only || only === 'game') for (const l of LANGS) {
    // «Закритий день» (розділ «Гра» на сайті): остання звичка → «+XP» летить до шкали рівня, банер, хвиля на живому фоні «Level Up»
    await setup(l);
    await ev(`{ const tk = keyOf(new Date()); S.habits.forEach((h, i) => { if (i !== 5) S.checks[tk][h.id] = 1; else delete S.checks[tk][h.id]; }); } UI.tdKeep = {}; [0, 1, 2, 3, 5].forEach(i => UI.tdKeep[S.habits[i].id] = 1);   // і остання звичка лишається в списку — кінець відео спокійний
      S.rw = {...(S.rw || {}), live: 'levelup'}; { const rw = rwSet; window.rwSet = () => new Set([...rw(), 'bglive']); }   // живий фон відкривається на вищому рівні — у демо вмикаємо
      TEXT_Z.l = 1.2; S.textSize = 'l'; S.cardStyle = 'glass';   // крупніше, щоб «+XP» і шкалу було видно; скляні картки — крізь них видно живий фон
      { const xi = xpInfo(); S.xpKeep = (+S.xpKeep || 0) + xi.need - xi.rest - 3; }   // до рівня бракує 3 XP — закритий день піднімає рівень
      save(); document.documentElement.classList.remove('noxp'); UI.page = 'home'; render({nav: true}); window.scrollTo(0, 0); 1`);
    await sleep(3500);
    const [cx, cy] = await ev(`(() => { const r = [...document.querySelectorAll('#page .tdw [data-act="toggle"]')].find(x => !x.classList.contains('on')).getBoundingClientRect(); return [r.left + 20, r.top + r.height / 2]; })()`);
    // кадр: шапка з рівнем і перший ряд віджетів; парні розміри для H.264
    const [x, y, w, h] = await ev(`(() => { const all = [...document.querySelectorAll('#page .card')].filter(e => !e.parentElement.closest('.card')), c = all.slice(0, 5).map(e => e.getBoundingClientRect());
      all.slice(5).forEach(e => e.style.visibility = 'hidden');   // наступний ряд не стирчить смужкою внизу кадру
      const x = Math.min(...c.map(r => r.left)) - 16, y = Math.max(0, Math.min(...c.map(r => r.top)) - 16), w = Math.max(...c.map(r => r.right)) + 16 - x, h = Math.max(...c.map(r => r.bottom)) + 16 - y;
      return [x, y, w, h].map(v => Math.round(v / 2) * 2); })()`);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvl-game-')), frames = [];
    on['Page.screencastFrame'] = p => { const f = path.join(dir, `f${String(frames.length).padStart(4, '0')}.jpg`); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({f, t: p.metadata.timestamp}); cmd('Page.screencastFrameAck', {sessionId: p.sessionId}); };
    await cmd('Page.startScreencast', {format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1});
    await sleep(1200);
    const t0 = frames.at(-1)?.t ?? 0;
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', {type, x: cx, y: cy, button: 'left', clickCount: 1});
    await sleep(4800);
    await cmd('Page.stopScreencast'); delete on['Page.screencastFrame'];
    const list = frames.map((x, i) => `file '${x.f.replace(/\\/g, '/')}'\nduration ${((frames[i + 1]?.t ?? x.t + 0.04) - x.t).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1).f.replace(/\\/g, '/')}'\n`;
    fs.writeFileSync(path.join(dir, 'list.txt'), list);
    const out = path.join(IMG, l, 'game.mp4'), start = frames[0].t;
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-fps_mode', 'cfr', '-r', '30', '-an', '-vf', `crop=${w}:${h}:${x}:${y}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', out]);
    // заставка — «+XP» у польоті до шкали (≈1 с після натискання)
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', (t0 - start + 1.0).toFixed(2), '-i', out, '-frames:v', '1', '-q:v', '3', path.join(IMG, l, 'game.jpg')]);
    console.log(`img/${l}/game.mp4 (${frames.length} кадрів, ${w}×${h})`);
    fs.rmSync(dir, {recursive: true, force: true});
  }

  if (!only || only === 'themes') for (const l of LANGS) {
    // значок «Свій стиль» видано заздалегідь — інакше на зміні теми вилазить банер; фон густіший, щоб його було видно між картками
    // розділ «Під себе» (LVL 5): теми по черзі, кожна зі своїм живим фоном, скляні картки; сайт підсвічує кнопку теми за часом відео (THEME_SEC)
    await setup(l);
    await ev(`S.rw = {...(S.rw || {}), fx: {}}; S.ach = S.ach || {}; S.ach.got = {...S.ach.got, aTheme: keyOf(new Date())}; { const rw = rwSet; window.rwSet = () => new Set([...rw(), 'bglive', 'bg:stars']); } S.cardStyle = 'glass'; save(); 1`);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvl-th-')), frames = [], marks = [];
    on['Page.screencastFrame'] = p => { const f = path.join(dir, `f${String(frames.length).padStart(4, '0')}.jpg`); fs.writeFileSync(f, Buffer.from(p.data, 'base64')); frames.push({f, t: p.metadata.timestamp}); cmd('Page.screencastFrameAck', {sessionId: p.sessionId}); };
    await cmd('Page.startScreencast', {format: 'jpeg', quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1});
    for (const [i, th] of THEMES.entries()) {
      const [bg, col] = THEME_BG[th];
      await ev(`hideModal(); S.theme = '${th}'; applyTheme(); S.rw.live = '${bg}'; S.rw.fx['${bg}'] = {col: '${col}', den: 2, spd: 1.2}; UI.page = 'home'; render({nav: true}); window.scrollTo(0, 0); [...document.querySelectorAll('#page .card')].filter(e => !e.parentElement.closest('.card')).slice(5).forEach(e => e.style.visibility = 'hidden'); 1`);   // другий ряд віджетів схований — унизу кадру видно сам живий фон
      await sleep(i ? 120 : 2500);   // перша тема — даємо фону розігнатися, кадри до позначки обріжуться
      marks.push(frames.at(-1).t);
      await sleep((THEME_SEC + THEME_FADE + 0.4) * 1000);   // запас на перехід; перші 0.25 с після перемикання (перемальовка) не беруться
    }
    await cmd('Page.stopScreencast'); delete on['Page.screencastFrame'];
    const list = frames.map((x, i) => `file '${x.f.replace(/\\/g, '/')}'\nduration ${((frames[i + 1]?.t ?? x.t + 0.04) - x.t).toFixed(3)}`).join('\n') + `\nfile '${frames.at(-1).f.replace(/\\/g, '/')}'\n`;
    fs.writeFileSync(path.join(dir, 'list.txt'), list);
    // 1) суцільний запис → raw.mp4; 2) шматок на кожну тему + перша ще раз у кінці, між ними наплив xfade;
    // 3) обрізаємо так, що останній кадр = першому: відео крутиться по колу без стику
    const raw = path.join(dir, 'raw.mp4'), out = path.join(IMG, l, 'themes.mp4'), L = THEME_SEC + THEME_FADE, X = THEME_FADE;
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt'), '-fps_mode', 'cfr', '-r', '30', '-an', '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '14', '-preset', 'fast', raw]);
    const starts = [...marks, marks[0]].map(m => (m - frames[0].t + 0.25).toFixed(3));
    const inputs = starts.flatMap(t => ['-ss', t, '-t', L.toFixed(3), '-i', raw]);
    let g = starts.map((t, i) => `[${i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=30[s${i}]`).join(';'), prev = 's0';
    for (let k = 1; k < starts.length; k++) { g += `;[${prev}][s${k}]xfade=transition=fade:duration=${X}:offset=${(k * THEME_SEC).toFixed(3)}[x${k}]`; prev = 'x' + k; }
    g += `;[${prev}]trim=start=${X}:end=${(X + THEMES.length * THEME_SEC).toFixed(3)},setpts=PTS-STARTPTS[v]`;
    execFileSync(FFMPEG_FULL, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', g, '-map', '[v]', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', out]);
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', '0.3', '-i', out, '-frames:v', '1', '-q:v', '3', path.join(IMG, l, 'themes.jpg')]);
    console.log(`img/${l}/themes.mp4 (${(fs.statSync(out).size / 1e6).toFixed(1)} МБ), зсуви тем: ${marks.map(m => (m - marks[0]).toFixed(2)).join(' ')}`);
    fs.rmSync(dir, {recursive: true, force: true});
  }
} finally { ws.close(); chrome.kill(); srv.close(); }
