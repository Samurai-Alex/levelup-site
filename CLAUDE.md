# levelup-tracker.com — сайт LEVEL UP

Статичний сайт на GitHub Pages (репозиторій `Samurai-Alex/levelup-site`, гілка `main`), домен у Cloudflare (DNS only, підтверджений у GitHub).

## Файли
- `index.html` — головна (тексти uk/ru/en у JS-обʼєкті `L`, мова — `localStorage.lang`).
- `about.html`, `terms.html`, `privacy.html`, `contact.html` — документи; спільні `docs.css` і `docs.js` (шапка, підвал, мова).
- `img/` — знімки програми на демо-даних, `img/demo.mp4`, `img/og.png`; `changes.js` («Що нового»), `logos.js` (місце тора/свічок).
- `CNAME`, `robots.txt`, `sitemap.xml`.

## Оновити матеріали
- `node tools/capture.mjs` — нові скриншоти й відео з `../HabitTrackerApp/app` (Chrome headless).
- `node tools/changes.mjs` — «Що нового» з `../HabitTrackerApp/app/js/updates.js` (після кожного релізу).
- Картинка для соцмереж — команда в шапці `tools/og.html`.

## Перевірка й публікація
- Локально: сервер теки на `http://localhost:8776/`.
- Публікація: commit, потім
  `git -c credential.helper= -c "credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential" push origin main`
  (звичайний `git push` зависає на вікні входу). Сайт оновлюється за ~1 хв.
- Якщо push відхилено: GitHub сам додає коміти `CNAME` при зміні домену — `git fetch` + `git rebase origin/main`.

## Правила
- Тексти на трьох мовах (uk, ru, en). Стиль — темний, зелений акцент, пікселевий заголовок.
- «Інформація на сайті не є публічною офертою» — лишати в підвалі.
- Візуальні зміни — спершу показати варіанти.
