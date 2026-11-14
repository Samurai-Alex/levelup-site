// Розгортає лічильник (dl.levelup-tracker.com): таблиця подій у D1, код, секрети для тижневого звіту в Telegram, пробний звіт.
//   node tools/counter/setup.mjs
// Токен бота й чат — з %USERPROFILE%\.tauri\feedback.json (як у levelup-bot), ніде не виводяться.
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIR = import.meta.dirname, CFG = path.join(os.homedir(), '.tauri', 'feedback.json');
const cfg = JSON.parse(fs.readFileSync(CFG, 'utf8'));
if (!cfg.token || !cfg.chat) throw new Error('feedback.json: немає token або chat');
if (!cfg.reportKey) { cfg.reportKey = crypto.randomBytes(16).toString('hex'); fs.writeFileSync(CFG, JSON.stringify(cfg, null, 2)); }
const run = (args, input) => {
  const r = spawnSync('npx', ['wrangler', ...args], {cwd: DIR, input, encoding: 'utf8', shell: true});
  if (r.status !== 0) throw new Error(`wrangler ${args[0]}: ${(r.stderr || r.stdout || '').slice(-600)}`);
  return r.stdout + r.stderr;
};

run(['d1', 'execute', 'levelup-counter', '--remote', '--command', '"CREATE TABLE IF NOT EXISTS ev (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k))"']);
console.log('D1: таблиця ev є');
run(['deploy']); console.log('лічильник розгорнуто');
for (const [k, v] of [['BOT_TOKEN', cfg.token], ['ADMIN_CHAT', String(cfg.chat)], ['REPORT_KEY', cfg.reportKey]]) { run(['secret', 'put', k], v); console.log('секрет', k, '— збережено'); }
const r = await fetch(`https://dl.levelup-tracker.com/report?key=${cfg.reportKey}`);
console.log('пробний звіт у Telegram:', r.ok ? 'надіслано' : `помилка ${r.status}`);
