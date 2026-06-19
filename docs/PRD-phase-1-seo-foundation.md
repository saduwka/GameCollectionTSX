# PRD — Phase 1: SEO-фундамент и миграция на Next.js

| Поле | Значение |
|---|---|
| Документ | Product Requirements Document |
| Фаза проекта | 1 из 7 (SEO-фундамент) |
| Версия | 1.0 |
| Автор | Нұржан Сәду |
| Дата | 25 мая 2026 |
| Статус | Draft → Review |
| Целевой релиз | v2.0 «PlayHub Wiki» |
| Длительность | 3 недели (15 рабочих дней) |
| Зависимости | Текущая ветка `main` (Vite SPA, React 19, Firebase) |

---

## 1. TL;DR

PlayHub сегодня — это клиент-сайд SPA на Vite, которая отлично работает для авторизованного пользователя, но **полностью невидима для поисковых систем** и не имеет богатых превью в соцсетях. Чтобы превратить проект в полноценную «геймвикипедию», нужен SEO-фундамент: серверный рендеринг страниц игр, человекочитаемые URL, sitemap, структурированные данные и динамические OG-изображения.

Эта фаза мигрирует кодовую базу на **Next.js 15 (App Router)** с сохранением всей текущей функциональности и Firebase-инфраструктуры. Главная страница, страницы игр, жанров и платформ становятся **ISR-страницами** с TTL 24 часа. Каждая страница игры получает уникальный slug, JSON-LD-разметку `VideoGame` и OG-изображение, генерируемое на лету.

**Главный KPI**: 1000+ страниц проиндексировано в Google Search Console через 60 дней после релиза.

---

## 2. Проблема и контекст

### 2.1. Текущее состояние

| Аспект | Сейчас | Проблема |
|---|---|---|
| Рендеринг | CSR (Vite SPA) | Google индексирует только пустой HTML, контент догружается JS — крайне медленная индексация и потеря long-tail трафика |
| URL игры | `/game/3328` (числовой ID RAWG) | Не SEO-friendly, не запоминается, не передаёт смысл |
| `<title>` и `<meta>` | Статичные из `index.html` | Все страницы выглядят одинаково в выдаче |
| OG-превью | Заглушка `via.placeholder.com` из README | Ссылки на игры в Telegram/Discord не разворачиваются |
| Sitemap | Отсутствует | Поисковики не знают о страницах |
| Schema.org | Отсутствует | Нет rich snippets в Google (звёзды, рейтинг, дата релиза) |
| robots.txt | Отсутствует | Нет контроля над краулерами |
| Перелинковка | Слабая (только из коллекции) | Изолированные страницы → низкий PageRank |

### 2.2. Почему это критично именно сейчас

1. **Конкуренты доминируют long-tail запросами.** IGDB, MobyGames, RAWG, HowLongToBeat — все они SSR. По запросу «how long to beat Elden Ring» PlayHub не появится никогда без SSR.
2. **Цель проекта — «каждый мог подобрать игру по душе»**, что предполагает приток органического трафика. Без SEO целевая аудитория не найдёт сайт.
3. **Стоимость миграции линейно растёт** с количеством страниц и фич. Сейчас в проекте ~10 страниц — момент идеальный.
4. **Текущий стек React 19 + React Query** полностью совместим с Next.js 15 App Router. Миграция — это в первую очередь перенос и обёртка, а не переписывание.

### 2.3. Что мы НЕ делаем в этой фазе

- ❌ Не переделываем UI/UX и не меняем дизайн.
- ❌ Не добавляем новые фичи (рецензии, гайды, квиз — фазы 4-5).
- ❌ Не создаём страницы жанров/разработчиков — это Фаза 2.
- ❌ Не внедряем i18n (вынесено в Фазу 7).
- ❌ Не меняем Firestore-схему.
- ❌ Не убираем Firebase Hosting — оставляем как fallback; основной хостинг переезжает на Vercel.

---

## 3. Цели и метрики успеха

### 3.1. Бизнес-цели

| # | Цель | Метрика | Baseline | Target (T+60 дней) |
|---|---|---|---|---|
| G1 | Поисковая индексация | Страниц в индексе Google | ~5 | 1 000+ |
| G2 | Органический трафик | Уников из поиска / неделю | ~0 | 500+ |
| G3 | Расшариваемость | CTR превью в соцсетях | n/a | базовая метрика установлена |
| G4 | Производительность | Lighthouse Performance (mobile) | 65 | 90+ |
| G5 | Core Web Vitals | LCP / INP / CLS | n/a | «Good» во всех трёх |

### 3.2. Технические критерии приёмки (Definition of Done)

- [ ] Все текущие маршруты работают на Next.js без визуальных регрессий.
- [ ] Страница `/game/[slug]` отрендерена на сервере, HTML содержит контент игры до выполнения JS (проверяется `curl` и Lighthouse).
- [ ] `sitemap.xml` доступен по `/sitemap.xml`, обновляется ежедневно, содержит ≥1000 URL.
- [ ] `robots.txt` корректен, продакшен открыт, превью-окружения закрыты.
- [ ] Каждая страница игры содержит `<script type="application/ld+json">` с валидным `VideoGame` schema.org (тест: Rich Results Test от Google).
- [ ] OG-изображение генерируется на лету для каждой игры и валидно (1200×630, < 250 КБ).
- [ ] Старые URL вида `/game/:id` редиректят на `/game/:slug` через 301.
- [ ] Lighthouse SEO score = 100 на трёх ключевых типах страниц.
- [ ] Все Firebase-функции (auth, Firestore, коллекция) работают идентично.
- [ ] CI: `next build` зелёный, type-check и lint без ошибок.

---

## 4. Целевая аудитория и user stories

### 4.1. Сегменты

| Сегмент | Доля | Описание |
|---|---|---|
| **Anonymous Searcher** | 70% (новый трафик) | Гуглит «лучшие RPG 2025», «soulslike похожие на dark souls», попадает на PlayHub впервые |
| **Shareer** | 20% | Делится ссылкой на игру в Telegram/Discord/Twitter — нужно красивое превью |
| **Returning Collector** | 10% | Уже есть аккаунт, ведёт коллекцию — не должен заметить миграцию |

### 4.2. User stories

**US-1**: Как **анонимный пользователь из Google**, я хочу видеть страницу игры с описанием, рейтингом и скриншотами сразу при открытии ссылки, чтобы понять, интересна ли мне эта игра, не дожидаясь загрузки JS.

**US-2**: Как **владелец Telegram-канала про игры**, я хочу, чтобы при вставке ссылки на игру разворачивалось красивое превью с обложкой, названием и рейтингом, чтобы повысить CTR.

**US-3**: Как **поисковый краулер Google**, я хочу получить машиночитаемые данные об игре (JSON-LD), чтобы показать в выдаче рейтинг, дату релиза и платформы.

**US-4**: Как **существующий пользователь**, я хочу сохранить все свои закладки и историю — старые ссылки `/game/3328` должны продолжать работать.

**US-5**: Как **разработчик проекта**, я хочу понимать, какие страницы проиндексированы и какие ошибки нашёл Google, через подключённый Search Console.

---

## 5. Функциональные требования

### 5.1. URL-схема и роутинг

| Текущий URL | Новый URL | Тип рендеринга | TTL |
|---|---|---|---|
| `/` (Recommendations) | `/` (новая Home-витрина) | ISR | 1 час |
| n/a | `/me` (Recommendations для логина) | CSR (приватный) | — |
| `/game/:id` | `/game/[slug]` (slug = `kebab-case` имени) | ISR | 24 часа |
| `/game/:id/:platformId` | `/game/[slug]?platform=:platformSlug` | ISR | 24 часа |
| `/games` | `/games` (каталог с фасетами) | ISR + клиентский query | 6 часов |
| `/platforms` | `/platforms` | SSG | revalidate weekly |
| `/platform/:id` | `/platform/[slug]` | ISR | 24 часа |
| `/search` | `/search?q=...` | CSR | — |
| `/collection` | `/collection` | CSR (приватный) | — |
| `/collection/:uid` | `/u/[uid]/collection` | SSR (публичный) | no-cache |
| `/profile` | `/profile` | CSR | — |
| `*` | `not-found.tsx` | Static | — |

**Слаги**: генерируются функцией `slugify(name)` (kebab-case, транслит для RU). Карта `slug → rawgId` хранится в Firestore-коллекции `game_slugs` для O(1) lookup и для разрешения конфликтов (две игры с одинаковым названием → к slug добавляется год: `nfs-2022`).

### 5.2. Структура страницы игры (`/game/[slug]`)

**HTML, который сервер обязан вернуть до выполнения JS:**

1. `<title>` — `{name} ({year}) — PlayHub`
2. `<meta name="description">` — первые 155 символов `description_raw`.
3. **Open Graph**: `og:title`, `og:description`, `og:image` (динамический), `og:url`, `og:type=video.other`.
4. **Twitter Card**: `summary_large_image`.
5. **Canonical link**.
6. **JSON-LD** `VideoGame` (см. § 5.4).
7. **Видимый контент**: заголовок, год, рейтинг, обложка, описание (первые 500 символов), список платформ, жанров, разработчиков, тегов. Скриншоты/трейлеры/CheapShark — могут грузиться на клиенте.
8. **Внутренние ссылки**: все жанры/платформы/разработчики/теги — это `<a href>` (даже если страница назначения пока 404 — будет в Фазе 2).

### 5.3. Sitemap

- Файл: `app/sitemap.ts` (Next.js встроенный генератор).
- Источники URL:
  - Топ-10 000 игр по `added` из RAWG (выгрузка раз в сутки в Firestore-коллекцию `sitemap_games`).
  - Все статичные страницы (`/`, `/games`, `/platforms`).
  - Все платформы из RAWG `/platforms` (≈100).
- Разбивка: при > 50 000 URL — sitemap index с шардами по 10 000.
- `<lastmod>`: время последнего обновления записи RAWG (`updated` поле).
- `<changefreq>`: `weekly` для игр, `monthly` для платформ.
- `<priority>`: 1.0 для топ-100 игр, 0.7 для топ-1000, 0.5 для остальных.

### 5.4. JSON-LD `VideoGame` schema

Минимальный обязательный набор полей:

```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "The Witcher 3: Wild Hunt",
  "url": "https://playhub.app/game/the-witcher-3-wild-hunt",
  "image": "https://...background_image",
  "description": "...",
  "genre": ["RPG", "Action"],
  "gamePlatform": ["PC", "PlayStation 5"],
  "publisher": { "@type": "Organization", "name": "CD Projekt" },
  "datePublished": "2015-05-18",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.7,
    "bestRating": 5,
    "ratingCount": 6841
  }
}
```

Валидация: автоматический check через Rich Results Test API в CI (один sample-URL на каждый PR).

### 5.5. OG-изображения

- Технология: `next/og` (бывший `@vercel/og`) на edge runtime.
- Endpoint: `app/api/og/game/[slug]/route.tsx`.
- Композиция: фон — `background_image` игры (с тёмным градиентом), наложение — название, год, рейтинг, лого PlayHub.
- Кэш: `Cache-Control: public, max-age=86400, immutable` + Vercel CDN.
- Fallback: статичное OG `og-default.png` если RAWG не ответил за 3 сек.

### 5.6. robots.txt

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /collection
Disallow: /profile
Sitemap: https://playhub.app/sitemap.xml
```

Превью-деплои (`*.vercel.app`) — полный `Disallow: /` через переменную окружения.

### 5.7. Редиректы и обратная совместимость

| От | К | Код | Реализация |
|---|---|---|---|
| `/game/:id` (числовой) | `/game/[slug]` | 301 | middleware: lookup в `game_slugs`, fallback на RAWG |
| `/collection/:uid` | `/u/[uid]/collection` | 301 | `next.config.js → redirects()` |
| любой URL с trailing slash | без слэша | 301 | `next.config.js → trailingSlash: false` |

### 5.8. Search Console и аналитика

- Подключить домен в Google Search Console через DNS-верификацию.
- Подать sitemap.xml.
- Подключить Plausible (self-hosted на VPS $5/мес) или Umami для приватной аналитики без cookie-баннера.
- В Sentry настроить релиз-трекинг и Web Vitals.

---

## 6. Нефункциональные требования

| Категория | Требование |
|---|---|
| **Производительность** | LCP < 2.5s, INP < 200ms, CLS < 0.1 на mobile 4G (Moto G4 в Lighthouse) |
| **Доступность** | WCAG 2.1 AA на страницах игр (axe-core в CI) |
| **Совместимость** | Последние 2 версии Chrome/Safari/Firefox/Edge, iOS Safari 16+, Android Chrome 110+ |
| **Безопасность** | CSP-заголовки, `X-Frame-Options: DENY`, RAWG ключ только на сервере |
| **Стоимость** | Vercel Hobby (бесплатно) на старте; при росте — Pro $20/мес |
| **Rate limits** | RAWG 20 000 req/мес → весь серверный трафик через ISR-кэш и Firestore-зеркало |
| **Доступность сервиса** | 99.5% (Vercel SLA) |

---

## 7. Технические требования и архитектура

### 7.1. Стек после миграции

| Слой | Было | Стало |
|---|---|---|
| Framework | Vite 6 + React Router 7 | **Next.js 15 (App Router)** |
| Рендеринг | CSR | SSR + ISR + клиентские части |
| Хостинг | Firebase Hosting | **Vercel** (Frankfurt edge) |
| Auth | Firebase Auth (client SDK) | Firebase Auth + cookie-сессия для SSR |
| DB | Firestore | Firestore (без изменений) |
| State | React Query | React Query (server + client) |
| Стили | CSS Modules | CSS Modules (сохраняем) |
| Изображения | `<img>` | `next/image` |

### 7.2. Структура каталогов после миграции

```
app/
  layout.tsx                  # корневой layout (был main.tsx)
  page.tsx                    # / — новая Home-витрина (ISR)
  me/page.tsx                 # /me — Recommendations (приватный)
  game/[slug]/
    page.tsx                  # SSR + JSON-LD
    opengraph-image.tsx       # динамический OG
    loading.tsx               # skeleton
    not-found.tsx
  games/page.tsx              # каталог
  platforms/
    page.tsx
    [slug]/page.tsx
  search/page.tsx
  collection/page.tsx
  u/[uid]/collection/page.tsx # публичная коллекция (SSR)
  profile/page.tsx
  api/
    og/game/[slug]/route.tsx
    revalidate/route.ts
  sitemap.ts
  robots.ts
lib/
  rawg/                       # бывший services/games (server-only)
  firebase/
    server.ts                 # firebase-admin
    client.ts                 # текущий клиент
  slugify.ts
  jsonld.ts
components/                   # без изменений
middleware.ts                 # редиректы id → slug
```

### 7.3. Серверный RAWG-клиент

Текущий `apiClient.ts` использует `import.meta.env.VITE_RAWG_API_KEY`, что **публикует ключ в бандле**. После миграции:

- Ключ хранится только в `process.env.RAWG_API_KEY` (без `NEXT_PUBLIC_`).
- Все вызовы RAWG — из server components или route handlers.
- На клиенте оставляем только CheapShark (публичный API без ключа) и Firestore.
- Слой кэширования: `unstable_cache` Next.js с тегами для точечной инвалидации.

### 7.4. Авторизация в SSR

Firebase Auth по умолчанию client-only. Для SSR публичной коллекции (`/u/[uid]/collection`) аутентификация не нужна — UID берётся из URL. Для приватных страниц (`/collection`, `/profile`, `/me`) сохраняем CSR-подход: `useAuth()` hook, redirect на `/` если не залогинен. Это упрощает миграцию и не требует firebase-admin токенов.

### 7.5. ISR и инвалидация

- Дефолтный `revalidate = 86400` (24 ч) для страниц игр.
- Manual revalidate через `POST /api/revalidate?tag=game-{slug}` с секретным токеном (для будущего админ-интерфейса).
- При первом запросе игры (cold start) — fetch из RAWG, save в Firestore-зеркало, return.

### 7.6. CI/CD

- GitHub Actions: lint, type-check, build, axe-a11y, Lighthouse CI (3 ключевые страницы).
- Preview-деплой на каждый PR через Vercel Git Integration.
- Production-деплой на merge в `main`.

---

## 8. План работ (15 рабочих дней)

| День | Спринт | Задачи |
|---|---|---|
| 1 | Подготовка | Создать ветку `phase-1-nextjs`. Поднять пустой Next.js 15 в подпапке `next/`, проверить деплой на Vercel |
| 2 | Инфра | Перенести Firebase config, Auth Context, React Query setup. Сверстать root layout |
| 3 | Сервисы | Перенести RAWG services из `src/services/games` в `lib/rawg`, изолировать server-only |
| 4-5 | Главная | Реализовать новую `/` витрину (Trending, New Releases, Top Rated) с ISR |
| 6-7 | Страница игры | `/game/[slug]` с полным контентом, JSON-LD, slug resolver, SSR-частью + клиентскими секциями (CheapShark, YouTube) |
| 8 | OG | `opengraph-image.tsx`, валидация в Twitter Card Validator |
| 9 | Каталог | Миграция `/games` с фасет-фильтрами в URL |
| 10 | Платформы | `/platforms`, `/platform/[slug]` |
| 11 | Sitemap+robots | `sitemap.ts`, `robots.ts`, выгрузка топ-10k в Firestore через cron |
| 12 | Редиректы | Middleware `id → slug`, маппинг `/collection/:uid → /u/[uid]/collection`, legacy URL тесты |
| 13 | Auth + приватные | Перенести `/collection`, `/profile`, `/me` (Recommendations) |
| 14 | QA | Lighthouse, Rich Results Test, axe, e2e Playwright по 8 ключевым флоу |
| 15 | Релиз | Search Console, Plausible, продакшен-деплой на Vercel, smoke-тесты |

---

## 9. Риски и митигации

| # | Риск | Вероятность | Влияние | Митигация |
|---|---|---|---|---|
| R1 | RAWG лимит 20k req/мес исчерпается при заполнении ISR-кэша | Высокая | Высокое | Прогрев кэша батчами по 500/день; Firestore-зеркало топ-10k; on-demand fetch только для редких игр |
| R2 | Slug-коллизии (две игры одинаково называются) | Средняя | Среднее | Suffix-год при коллизии; коллекция `game_slugs` в Firestore с уникальным индексом |
| R3 | Firebase Auth не работает в SSR | Низкая | Низкое | Приватные страницы остаются CSR — это легитимный паттерн Next.js |
| R4 | Сломаются старые ссылки пользователей | Средняя | Высокое | 301-редиректы по числовому ID; e2e-тест на 20 случайных старых URL |
| R5 | Vercel free tier (100 GB bandwidth) кончится | Низкая на старте | Среднее | Cloudflare перед Vercel; платный план $20/мес как fallback |
| R6 | Регрессии в существующем UI | Средняя | Высокое | Визуальные снапшоты через Playwright; feature flag `?legacy=1` на месяц после релиза |
| R7 | Параллельная разработка фич в `main` создаст merge-конфликты | Высокая | Среднее | Заморозка фич в `main` на 3 недели или регулярный rebase `phase-1-nextjs` |

---

## 10. Открытые вопросы

1. **Домен.** Сейчас Firebase Hosting предоставляет `*.web.app`. Для SEO нужен свой домен (`playhub.app` / `playhub.gg` / `gamehub.kz`). Решение: купить до старта Фазы 1.
2. **Slug для существующих игр.** Генерировать единоразово батчем или лениво при первом запросе? Решение: единоразовый прогрев топ-10k + ленивый для остальных.
3. **i18n уже сейчас или в Фазе 7?** Если RU/EN решаем сразу — это +5 дней (структура URL `/[locale]/game/[slug]`). Рекомендация: вынести в Фазу 7, чтобы не блокировать SEO.
4. **CheapShark в SSR или CSR?** Цены часто меняются — оставляем CSR с client query. ОК.
5. **Subdomain для приватных страниц?** `app.playhub.app` для коллекции/профиля, `playhub.app` — публичная вики. Уменьшит cookie surface и улучшит cache hit. Решение: отложить до Фазы 6.

---

## 11. Метрики после релиза (трекинг)

Еженедельный дашборд в Plausible + Search Console:

- Impressions и Clicks по запросам (top-50).
- Среднее место в выдаче.
- Coverage report (Indexed / Excluded).
- Web Vitals (LCP/INP/CLS).
- Conversion: % посетителей из поиска, которые открыли ≥ 2 страниц.
- Server-side error rate (Sentry).

Чекпоинт через 30 дней: если индексировано < 200 страниц — диагностика (sitemap pinging, internal linking, content depth).

---

## 12. Приложения

### A. Глоссарий

- **ISR** — Incremental Static Regeneration. Страницы статичны, но автоматически обновляются по TTL.
- **SSR** — Server-Side Rendering. Каждый запрос рендерится на сервере.
- **CSR** — Client-Side Rendering. Текущий подход PlayHub.
- **JSON-LD** — JSON for Linking Data. Способ передачи структурированных данных Google.
- **OG** — Open Graph. Протокол для превью ссылок в соцсетях.

### B. Ссылки на исследование

- [Next.js 15 App Router docs](https://nextjs.org/docs/app)
- [Google Search Central — VideoGame schema](https://developers.google.com/search/docs/appearance/structured-data/video-game)
- [RAWG API docs](https://rawg.io/apidocs)
- [Vercel ISR limits](https://vercel.com/docs/incremental-static-regeneration)

### C. Связь с другими фазами

- **Фаза 2 (Гипертекст)** напрямую зависит от этой фазы — страницы жанров/разработчиков невозможны без SSR.
- **Фаза 3 (Meilisearch)** независима, может идти параллельно после дня 10.
- **Фаза 5 (Discovery-квиз)** независима.

---

*Документ готов к ревью. Следующий шаг: согласование с самим собой как stakeholder-разработчиком, затем создание эпика и тикетов под каждый день спринта.*
