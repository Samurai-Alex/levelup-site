// «Що нового» для сайту: останні 3 версії LEVEL UP зі списку змін програми (app/js/updates.js → changes.js).
// Запускати після кожного релізу: node tools/changes.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SITE = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.resolve(SITE, '../HabitTrackerApp/app/js/updates.js'), 'utf8');
const m = src.match(/const CHANGES = (\{[\s\S]*?\n\});/);
if (!m) throw new Error('CHANGES not found in updates.js');
const CHANGES = vm.runInNewContext('(' + m[1].replace(/;$/, '') + ')');
const out = Object.entries(CHANGES).filter(([, c]) => c.levelup).slice(0, 3)
  .map(([v, c]) => ({v, uk: c.levelup.uk || c.levelup.ru, ru: c.levelup.ru, en: c.levelup.en}));
if (!out.length || out.some(x => !x.ru || !x.en)) throw new Error('unexpected CHANGES shape');
fs.writeFileSync(path.join(SITE, 'changes.js'), `// згенеровано tools/changes.mjs — не редагувати вручну\nwindow.CHANGES = ${JSON.stringify(out, null, 1)};\n`);
console.log('changes.js:', out.map(x => x.v).join(', '));
