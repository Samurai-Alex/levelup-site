// node --test tools/counter — події фільтруються, звіт рахує частки від переглядів
import test from 'node:test';
import assert from 'node:assert/strict';
import w, {report} from './worker.js';

// rows — цей тиждень, prev — попередній (звіт питає саме в такому порядку)
const fakeDB = (rows, prev = []) => {
  const added = [], weeks = [rows, prev];
  const st = sql => ({bind: (...a) => ({sql, a, all: async () => ({results: weeks.shift() || []}), run: async () => {}}), run: async () => {}, first: async () => ({n: 5})});
  return {added, prepare: st, batch: async list => list.forEach(x => added.push(x.a[1]))};
};
const UA = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0)'};

test('/e: лише відомі події + країна при перегляді', async () => {
  const DB = fakeDB([]);
  const req = new Request('https://dl.x/e?k=view_uk,lvl3,evil_key,ref_google,src_tg,view_uk', {headers: UA});
  req.cf = {country: 'UA'};
  const r = await w.fetch(req, {DB});
  assert.equal(r.status, 204);
  assert.deepEqual(DB.added, ['view_uk', 'lvl3', 'ref_google', 'src_tg', 'cc_UA']);
});

test('/e: боти не рахуються', async () => {
  const DB = fakeDB([]);
  await w.fetch(new Request('https://dl.x/e?k=view_ru', {headers: {'user-agent': 'Googlebot'}}), {DB});
  assert.deepEqual(DB.added, []);
});

test('/dl?from=hero&v=src_tg рахує кнопку й джерело, веде на установник', async () => {
  const DB = fakeDB([]);
  const r = await w.fetch(new Request('https://dl.x/dl?from=hero&v=src_tg', {headers: UA}), {DB});
  assert.equal(r.status, 302);
  assert.deepEqual(DB.added, ['dl_hero', 'dlv_src_tg']);
});

const R = (o) => Object.entries(o).map(([k, n]) => ({k, n}));
test('звіт: частки, порівняння з минулим тижнем, висновки, без порожніх рядків', async () => {
  const DB = fakeDB(R({view_ru: 60, view_uk: 40, mob: 30, win: 70, lvl1: 90, lvl2: 80, lvl3: 50, lvl4: 45, dl_hero: 8, dl_fin: 2, cc_UA: 70, src_tg: 20, dlv_src_tg: 6, direct: 50, dlv_direct: 2}), R({view_ru: 80, dl_hero: 5}));
  const t = await report({DB});
  assert.match(t, /Посещения: 100 \(\+25%\) — ru 60, uk 40/);
  assert.match(t, /Скачали: 10 \(\+100%\) — 10% посетителей \(первый экран 8, внизу 2\)/);
  assert.match(t, /С телефона: 30%/);
  assert.match(t, /Больше всего уходят между «LVL 2 Привычки» и «LVL 3 Деньги» — 30%/);
  assert.match(t, /Лучше всего качают: метка tg — 30% \(6 из 20\)/);
  assert.match(t, /Откуда: прямые заходы 50 \(скачали 2\), метка tg 20 \(скачали 6\)/);
  assert.doesNotMatch(t, /LVL 5|Цены|en 0|шапка|темы/);   // нулі не показуються
});

test('звіт без відвідувань — один рядок', async () => {
  assert.match(await report({DB: fakeDB([])}), /Посещений пока не было\.$/);
});

// відгуки: у базу — неопублікованим, адміну — повідомлення з посиланнями; пастка й порожні поля відсікаються
const rvDB = () => { const runs = []; return {runs, prepare: sql => ({bind: (...a) => ({first: async () => (runs.push([sql, a]), {id: 7}), run: async () => runs.push([sql, a])})})}; };
const post = body => new Request('https://dl.x/review', {method: 'POST', headers: UA, body: new URLSearchParams(body)});
test('POST /review: зберігає й надсилає адміну на перевірку', async () => {
  const DB = rvDB(), sent = [], f0 = globalThis.fetch;
  globalThis.fetch = async (u, o) => (sent.push(JSON.parse(o.body).text), new Response('{}'));
  try {
    const r = await w.fetch(post({name: ' Оля<b> ', stars: '4', text: 'Нормально работает, нравятся уровни', lang: 'uk'}), {DB, BOT_TOKEN: 't', ADMIN_CHAT: '1', REPORT_KEY: 'k'});
    assert.equal(r.status, 200);
    assert.deepEqual(DB.runs[0][1].slice(1), ['uk', 'Оляb', 4, 'Нормально работает, нравятся уровни']);
    assert.match(sent[0], /Новый отзыв #7 \(uk\) · ★★★★☆\nОляb:/);
    assert.match(sent[0], /Опубликовать: https:\/\/dl\.x\/rv\?id=7&ok=1&key=k/);
  } finally { globalThis.fetch = f0; }
});
test('POST /review: пастка, короткий текст і чужі зірки не проходять', async () => {
  const DB = rvDB();
  assert.equal((await w.fetch(post({name: 'Bot', stars: '5', text: 'buy cheap pills now', web: 'x'}), {DB})).status, 200);
  assert.equal((await w.fetch(post({name: 'Ян', stars: '5', text: 'ok'}), {DB})).status, 400);
  assert.equal((await w.fetch(post({name: 'Ян', stars: '9', text: 'Хорошая программа'}), {DB})).status, 400);
  assert.equal(DB.runs.length, 0);
});
test('/rv: без ключа не публикуется', async () => {
  const DB = rvDB();
  assert.equal((await w.fetch(new Request('https://dl.x/rv?id=7&ok=1&key=bad', {headers: UA}), {DB, REPORT_KEY: 'k'})).status, 404);
  assert.match(await (await w.fetch(new Request('https://dl.x/rv?id=7&ok=1&key=k', {headers: UA}), {DB, REPORT_KEY: 'k'})).text(), /опубликован/);
  assert.match(DB.runs[0][0], /UPDATE rv SET ok = 1/);
});
