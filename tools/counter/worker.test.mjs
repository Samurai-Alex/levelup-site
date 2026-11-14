// node --test tools/counter — події фільтруються, звіт рахує частки від переглядів
import test from 'node:test';
import assert from 'node:assert/strict';
import w, {report} from './worker.js';

const fakeDB = rows => {
  const added = [];
  const st = sql => ({bind: (...a) => ({sql, a, all: async () => ({results: rows}), run: async () => {}}), run: async () => {}, first: async () => ({n: 5})});
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

test('/dl?from=hero рахує кнопку й веде на установник', async () => {
  const DB = fakeDB([]);
  const r = await w.fetch(new Request('https://dl.x/dl?from=hero', {headers: UA}), {DB});
  assert.equal(r.status, 302);
  assert.deepEqual(DB.added, ['dl_hero']);
});

test('звіт: частки від переглядів', async () => {
  const DB = fakeDB([{k: 'view_ru', n: 60}, {k: 'view_uk', n: 40}, {k: 'mob', n: 30}, {k: 'lvl3', n: 50}, {k: 'dl_hero', n: 8}, {k: 'dl_fin', n: 2}, {k: 'cc_UA', n: 70}]);
  const t = await report({DB});
  assert.match(t, /Просмотры: 100 \(ru 60, uk 40, en 0\)/);
  assert.match(t, /С телефона: 30%/);
  assert.match(t, /Скачали: 10 — 10%/);
  assert.match(t, /LVL 3 Деньги: 50%/);
  assert.match(t, /Страны: UA 70/);
});
