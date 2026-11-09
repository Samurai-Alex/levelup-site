# levelup-tracker.com — сайт LEVEL UP

## Правила работы
- Отвечать пользователю **по-русски**.
- Неясно — сначала уточнить. Визуальные изменения — **сначала 2–3 варианта**, делать после выбора.
- Тексты сайта — на трёх языках: украинский, русский, английский.
- Стиль: тёмный фон, зелёный акцент (#2ee66b), пиксельный заголовок (Press Start 2P), основной шрифт JetBrains Mono. Без эмодзи в интерфейсе.
- В подвале всегда ссылки на документы. Фраза «Информация на сайте не является публичной офертой» — только в «Условиях использования» (`terms.html`), из подвала убрана по просьбе владельца.
- LEVEL UP станет платной: место под цены и кнопку покупки — объект `SHOP` в `index.html` (`buy: true`, ссылка, цена).
- Не коммитить секреты. Владелец в документах — просто «LEVEL UP», почта — support@levelup-tracker.com.

## Стек
- Статический сайт без сборки на **GitHub Pages** (репозиторий `Samurai-Alex/levelup-site`, ветка `main`), Jekyll по умолчанию (`_config.yml` скрывает `CLAUDE.md`, `README.md`, `tools/`).
- Домен в **Cloudflare** (записи DNS only), подтверждён в GitHub, HTTPS включён (Let's Encrypt от GitHub).
- Почта support@levelup-tracker.com — Cloudflare Email Routing → Gmail пользователя.

## Файлы
- `index.html` — главная; тексты в JS-объекте `L` (uk/ru/en), язык — `localStorage.lang`.
- `about.html`, `terms.html`, `privacy.html`, `contact.html` — документы; общие `docs.css` и `docs.js` (шапка, подвал, язык).
- `img/` — скриншоты программы на демо-данных, `demo.mp4`, `og.png`; `changes.js` («Что нового»), `logos.js` (живые тор и свечи поверх скриншотов тем).
- `CNAME`, `robots.txt`, `sitemap.xml`.

## Команды
- Переснять скриншоты и видео: `node tools/capture.mjs` (Chrome headless, берёт программу из `../HabitTrackerApp/app`).
- «Что нового» после релиза программы: `node tools/changes.mjs`.
- Картинка для соцсетей: команда в шапке `tools/og.html`.
- Локальный просмотр: сервер этой папки на `http://localhost:8776/`.
- Публикация: коммит, затем
  `git -c credential.helper= -c "credential.helper=!'C:/Program Files/GitHub CLI/gh.exe' auth git-credential" push origin main`
  (обычный `git push` зависает на окне входа). Сайт обновляется примерно за минуту.
- Если push отклонён: GitHub сам добавляет коммиты с `CNAME` при смене домена — `git fetch`, затем `git rebase origin/main`.
