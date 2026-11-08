// Счётчик скачиваний LEVEL UP: /dl считает нажатие и отдаёт установщик, /count — текущее число.
// Деплой: cd tools/counter && npx wrangler deploy
const FILE = 'https://github.com/Samurai-Alex/habit-tracker-updates/releases/download/levelup/Level-Up-setup.exe';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget/i;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=60' };

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/dl') {
      // HEAD и боты не считаются, чтобы проверки ссылок не накручивали число
      if (req.method === 'GET' && !BOT.test(req.headers.get('user-agent') || ''))
        await env.DB.prepare('UPDATE c SET n = n + 1 WHERE id = 1').run();
      return Response.redirect(FILE, 302);
    }
    if (pathname === '/count') {
      const row = await env.DB.prepare('SELECT n FROM c WHERE id = 1').first();
      return Response.json({ n: row ? row.n : 0 }, { headers: CORS });
    }
    return new Response('Not found', { status: 404 });
  }
};
