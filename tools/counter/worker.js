// Лічильник LEVEL UP (dl.levelup-tracker.com), без cookies:
//   /dl?from=head|hero|price|fin&v=src_tg — рахує натискання (з якої кнопки й звідки прийшла людина) й віддає установник; /count — скільки всього
//   /e?k=a,b,c — події сторінки за день: перегляди, мова, дійшов до розділу, звідки прийшов (воронка)
//   щопонеділка о 9:00 за Києвом — звіт за тиждень у Telegram (бот підтримки, секрети BOT_TOKEN і ADMIN_CHAT);
//   /reviews — опубліковані відгуки; POST /review — новий відгук (ім'я, зірки, текст) іде адміну в Telegram на перевірку,
//   /rv?id=N&ok=1|0&key=REPORT_KEY — опублікувати чи видалити (посилання з того ж повідомлення)
//   /report?key=REPORT_KEY — надіслати звіт зараз, &send=0 — лише повернути текст (для /stats у боті)
// Розгортання й секрети: node tools/counter/setup.mjs
const FILE = 'https://github.com/Samurai-Alex/habit-tracker-updates/releases/download/levelup/Level-Up-setup.exe';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|lighthouse/i;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };
// лише відомі події — щоб ніхто не засмічував базу довільними ключами
const EV = /^(view_(ru|uk|en)|mob|win|lvl[1-5]|more|inst|price|faq|fin|theme|howto|share|review|dl_(head|hero|price|fin)|cc_[A-Z]{2}|direct|ref_[a-z0-9]{1,20}|src_[a-z0-9]{1,12}|dlv_(direct|ref_[a-z0-9]{1,20}|src_[a-z0-9]{1,12}))$/;
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
        const k = ['dl_' + from, 'dlv_' + url.searchParams.get('v')].filter(x => EV.test(x));   // кнопка і джерело — для «звідки краще качають»
        if (k.length) await add(env, k);
      }
      return Response.redirect(FILE, 302);
    }
    if (url.pathname === '/count') {
      const row = await env.DB.prepare('SELECT n FROM c WHERE id = 1').first();
      return Response.json({ n: row ? row.n : 0 }, { headers: CORS });
    }
    // звіт одразу — для перевірки після розгортання (ключ REPORT_KEY лише в секретах і feedback.json)
    if (url.pathname === '/report' && env.REPORT_KEY && url.searchParams.get('key') === env.REPORT_KEY) return new Response(await report(env, 7, url.searchParams.get('send') !== '0'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    if (url.pathname === '/e') {
      if (human) {
        const keys = [...new Set((url.searchParams.get('k') || '').split(',').slice(0, 12))].filter(k => EV.test(k));
        if (keys.some(k => k.startsWith('view_')) && req.cf && /^[A-Z]{2}$/.test(req.cf.country || '')) keys.push('cc_' + req.cf.country);   // країна — з мережі Cloudflare, IP ніде не зберігається
        if (keys.length) await add(env, keys);
      }
      return new Response(null, { status: 204, headers: CORS });
    }
    if (url.pathname === '/reviews') {
      const { results } = await env.DB.prepare('SELECT name, stars, text, lang, at FROM rv WHERE ok = 1 ORDER BY id DESC LIMIT 30').all();
      return Response.json(results, { headers: CORS });
    }
    if (url.pathname === '/review' && req.method === 'POST') return review(req, env, url, human);
    if (url.pathname === '/rv' && env.REPORT_KEY && url.searchParams.get('key') === env.REPORT_KEY) {
      const id = +url.searchParams.get('id');
      await env.DB.prepare(url.searchParams.get('ok') === '1' ? 'UPDATE rv SET ok = 1 WHERE id = ?1' : 'DELETE FROM rv WHERE id = ?1').bind(id).run();
      return new Response(url.searchParams.get('ok') === '1' ? 'Отзыв #' + id + ' опубликован' : 'Отзыв #' + id + ' удалён', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    return new Response('Not found', { status: 404 });
  },
  async scheduled(ev, env) { await report(env); },
};

// відгук із сайту: форма (urlencoded — без preflight), перевірка полів, у базу неопублікованим, адміну — текст і два посилання.
// Пастка для ботів — приховане поле web: людина його не бачить і не заповнює.
// shortcut: від спаму лише пастка й ручна перевірка; якщо почнуть засипати — Turnstile на форму
export async function review(req, env, url, human) {
  const f = await req.formData().catch(() => null), H = { headers: CORS };
  if (!f || !human) return Response.json({ ok: false }, { status: 400, ...H });
  if (f.get('web')) return Response.json({ ok: true }, H);   // бот: робимо вигляд, що прийняли
  const clean = (v, n) => String(v || '').replace(/[\u0000-\u0009\u000B-\u001F\u007F<>]/g, '').trim().slice(0, n);
  const name = clean(f.get('name'), 40), text = clean(f.get('text'), 700), stars = Math.round(+f.get('stars')), lang = /^(ru|uk|en)$/.test(f.get('lang')) ? f.get('lang') : 'ru';
  if (name.length < 2 || text.length < 10 || !(stars >= 1 && stars <= 5)) return Response.json({ ok: false }, { status: 400, ...H });
  const r = await env.DB.prepare('INSERT INTO rv (at, lang, name, stars, text, ok) VALUES (?1, ?2, ?3, ?4, ?5, 0) RETURNING id').bind(day(), lang, name, stars, text).first();
  const link = ok => `${url.origin}/rv?id=${r.id}&ok=${ok}&key=${env.REPORT_KEY}`;
  await deliver(env, `Новый отзыв #${r.id} (${lang}) · ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}\n${name}:\n${text}\n\nОпубликовать: ${link(1)}\nУдалить: ${link(0)}`, true);
  return Response.json({ ok: true }, H);
}

// звіт за останні 7 днів (без сьогоднішнього) і порівняння з тижнем перед ними; порожні рядки не показуються
const STAGES = [['lvl1', 'LVL 1 Игра'], ['lvl2', 'LVL 2 Привычки'], ['lvl3', 'LVL 3 Деньги'], ['lvl4', 'LVL 4 ИИ'], ['lvl5', 'LVL 5 Под себя'], ['more', 'А ещё'], ['inst', 'Как установить'], ['price', 'Цены'], ['faq', 'Вопросы'], ['fin', 'Финальный призыв']];
const srcName = k => k === 'direct' ? 'прямые заходы' : k.startsWith('src_') ? 'метка ' + k.slice(4) : k.slice(4);
export async function report(env, days = 7, send = true) {
  const to = new Date(), from = new Date(to - days * 864e5), prev = new Date(from - days * 864e5);
  const sum = async (a, b) => { const { results } = await env.DB.prepare('SELECT k, SUM(n) n FROM ev WHERE day >= ?1 AND day < ?2 GROUP BY k').bind(day(a), day(b)).all(); return Object.fromEntries(results.map(r => [r.k, r.n])); };
  const m = await sum(from, to), p = await sum(prev, from), g = k => m[k] || 0, gp = k => p[k] || 0;
  const tot = (o, ks) => ks.reduce((a, k) => a + (o[k] || 0), 0), VK = ['view_ru', 'view_uk', 'view_en'], DK = ['dl_head', 'dl_hero', 'dl_price', 'dl_fin'];
  const views = tot(m, VK), dl = tot(m, DK), pViews = tot(p, VK);
  const pc = n => views ? Math.round(n / views * 100) + '%' : '—';
  const dt = (n, was) => !pViews ? '' : !was ? (n ? ' (впервые)' : '') : ` (${n >= was ? '+' : ''}${Math.round((n - was) / was * 100)}%)`;   // к прошлой неделе
  const list = (pre, f = r => r[0].slice(pre.length) + ' ' + r[1]) => Object.entries(m).filter(([k]) => k.startsWith(pre)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(f).join(', ');
  const head = `LEVEL UP · сайт за ${days} дней (${day(from)} — ${day(new Date(to - 864e5))})`;
  if (!views) return deliver(env, head + '\n\nПосещений пока не было.', send);
  // вывод: где больше всего уходят (от 10 визитов) и откуда лучше качают (от 5 визитов из источника)
  const out = [], st = STAGES.filter(([k]) => g(k));
  if (views >= 10 && st.length > 1) { let w = null; for (let i = 1; i < st.length; i++) { const d = g(st[i - 1][0]) - g(st[i][0]); if (!w || d > w.d) w = { d, a: st[i - 1][1], b: st[i][1] }; } if (w && w.d > 0) out.push(`Больше всего уходят между «${w.a}» и «${w.b}» — ${pc(w.d)} посетителей`); }
  const best = Object.keys(m).filter(k => /^(direct|ref_|src_)/.test(k) && g(k) >= 5).map(k => ({ k, r: g('dlv_' + k) / g(k) })).sort((a, b) => b.r - a.r)[0];
  if (best && best.r > 0) out.push(`Лучше всего качают: ${srcName(best.k)} — ${Math.round(best.r * 100)}% (${g('dlv_' + best.k)} из ${g(best.k)})`);
  const btn = [['dl_head', 'шапка'], ['dl_hero', 'первый экран'], ['dl_price', 'цены'], ['dl_fin', 'внизу']].filter(([k]) => g(k)).map(([k, t]) => t + ' ' + g(k)).join(', ');
  const lines = [head, ...(out.length ? ['', ...out] : []), '',
    `Посещения: ${views}${dt(views, pViews)} — ${VK.filter(k => g(k)).map(k => k.slice(5) + ' ' + g(k)).join(', ')}`,
    `Скачали: ${dl}${dt(dl, tot(p, DK))} — ${pc(dl)} посетителей${btn ? ` (${btn})` : ''}`,
    `С телефона: ${pc(g('mob'))} · с Windows: ${pc(g('win'))}`];
  if (st.length) lines.push('', 'Дошли до:', ...st.map(([k, t]) => `  ${t}: ${pc(g(k))}`));
  const act = [g('theme') && `переключали темы ${g('theme')}`, g('howto') && `нажали «Как установить» ${g('howto')}`, g('share') && `с телефона отправили ссылку на ПК ${g('share')}`, g('review') && `оставили отзыв ${g('review')}`].filter(Boolean);
  if (act.length) lines.push(act.join(' · '));
  const cc = list('cc_'), via = Object.keys(m).filter(k => /^(direct|ref_|src_)/.test(k)).sort((a, b) => g(b) - g(a)).slice(0, 6).map(k => `${srcName(k)} ${g(k)}${g('dlv_' + k) ? ` (скачали ${g('dlv_' + k)})` : ''}`).join(', ');
  if (cc || via) lines.push('');
  if (cc) lines.push('Страны: ' + cc);
  if (via) lines.push('Откуда: ' + via);
  return deliver(env, lines.join('\n'), send);
}
async function deliver(env, text, send) {
  if (!send || !env.BOT_TOKEN || !env.ADMIN_CHAT) return text;
  const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: String(env.ADMIN_CHAT), text, disable_web_page_preview: true }) });
  if (!r.ok) throw new Error('Telegram: ' + r.status);
  return text;
}
