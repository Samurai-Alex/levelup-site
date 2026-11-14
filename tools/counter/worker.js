// Лічильник LEVEL UP (dl.levelup-tracker.com), без cookies:
//   /dl?from=head|hero|fin — рахує натискання (і з якої кнопки) й віддає установник; /count — скільки всього
//   /e?k=a,b,c — події сторінки за день: перегляди, мова, дійшов до розділу, звідки прийшов (воронка)
//   щопонеділка о 9:00 за Києвом — звіт за тиждень у Telegram (бот підтримки, секрети BOT_TOKEN і ADMIN_CHAT)
// Розгортання й секрети: node tools/counter/setup.mjs
const FILE = 'https://github.com/Samurai-Alex/habit-tracker-updates/releases/download/levelup/Level-Up-setup.exe';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|lighthouse/i;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };
// лише відомі події — щоб ніхто не засмічував базу довільними ключами
const EV = /^(view_(ru|uk|en)|mob|win|lvl[1-5]|more|inst|price|faq|fin|theme|howto|dl_(head|hero|price|fin)|cc_[A-Z]{2}|ref_[a-z0-9]{1,20}|src_[a-z0-9]{1,12})$/;
const day = (d = new Date()) => d.toISOString().slice(0, 10);
const add = (env, keys) => env.DB.batch(keys.map(k => env.DB.prepare('INSERT INTO ev (day, k, n) VALUES (?1, ?2, 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1').bind(day(), k)));

export default {
  async fetch(req, env) {
    const url = new URL(req.url), human = !BOT.test(req.headers.get('user-agent') || '');
    if (url.pathname === '/dl') {
      // HEAD і боти не рахуються, щоб перевірки посилань не накручували число
      if (req.method === 'GET' && human) {
        await env.DB.prepare('UPDATE c SET n = n + 1 WHERE id = 1').run();
        const from = url.searchParams.get('from');
        if (EV.test('dl_' + from)) await add(env, ['dl_' + from]);
      }
      return Response.redirect(FILE, 302);
    }
    if (url.pathname === '/count') {
      const row = await env.DB.prepare('SELECT n FROM c WHERE id = 1').first();
      return Response.json({ n: row ? row.n : 0 }, { headers: CORS });
    }
    // звіт одразу — для перевірки після розгортання (ключ REPORT_KEY лише в секретах і feedback.json)
    if (url.pathname === '/report' && env.REPORT_KEY && url.searchParams.get('key') === env.REPORT_KEY) return new Response(await report(env), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (url.pathname === '/e') {
      if (human) {
        const keys = [...new Set((url.searchParams.get('k') || '').split(',').slice(0, 12))].filter(k => EV.test(k));
        if (keys.some(k => k.startsWith('view_')) && req.cf && /^[A-Z]{2}$/.test(req.cf.country || '')) keys.push('cc_' + req.cf.country);   // країна — з мережі Cloudflare, IP ніде не зберігається
        if (keys.length) await add(env, keys);
      }
      return new Response(null, { status: 204, headers: CORS });
    }
    return new Response('Not found', { status: 404 });
  },
  async scheduled(ev, env) { await report(env); },
};

// звіт за останні 7 днів (без сьогоднішнього)
export async function report(env, days = 7) {
  const to = new Date(), from = new Date(to - days * 864e5);
  const { results } = await env.DB.prepare('SELECT k, SUM(n) n FROM ev WHERE day >= ?1 AND day < ?2 GROUP BY k').bind(day(from), day(to)).all();
  const m = Object.fromEntries(results.map(r => [r.k, r.n])), g = k => m[k] || 0;
  const views = g('view_ru') + g('view_uk') + g('view_en'), dl = g('dl_head') + g('dl_hero') + g('dl_price') + g('dl_fin');
  const pc = n => views ? Math.round(n / views * 100) + '%' : '—';
  const top = p => results.filter(r => r.k.startsWith(p)).sort((a, b) => b.n - a.n).slice(0, 5).map(r => `${r.k.slice(p.length)} ${r.n}`).join(', ') || '—';
  const text = [`LEVEL UP · сайт за ${days} дней (${day(from)} — ${day(new Date(to - 864e5))})`, '',
    `Просмотры: ${views} (ru ${g('view_ru')}, uk ${g('view_uk')}, en ${g('view_en')})`,
    `С телефона: ${pc(g('mob'))} · с Windows: ${pc(g('win'))}`,
    `Скачали: ${dl} — ${pc(dl)} от просмотров (шапка ${g('dl_head')}, первый экран ${g('dl_hero')}, цены ${g('dl_price')}, внизу ${g('dl_fin')})`, '',
    'Воронка — дошли до:', ...[['lvl1', 'LVL 1 Игра'], ['lvl2', 'LVL 2 Привычки'], ['lvl3', 'LVL 3 Деньги'], ['lvl4', 'LVL 4 ИИ'], ['lvl5', 'LVL 5 Под себя'], ['more', 'А ещё'], ['inst', 'Как установить'], ['price', 'Цены'], ['faq', 'Вопросы'], ['fin', 'Финальный призыв']].map(([k, t]) => `  ${t}: ${pc(g(k))}`),
    `Переключали темы: ${g('theme')} · нажали «Как установить»: ${g('howto')}`, '',
    `Страны: ${top('cc_')}`, `Откуда: ${top('ref_')}`, `Метки ссылок (?s=): ${top('src_')}`].join('\n');
  if (!env.BOT_TOKEN || !env.ADMIN_CHAT) return text;
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: String(env.ADMIN_CHAT), text, disable_web_page_preview: true }) });
  if (!r.ok) throw new Error('Telegram: ' + r.status);
  return text;
}
