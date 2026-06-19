# PlayHub — Roadmap: Pi 3B → Production

Roadmap по выводу PlayHub в продакшен на домашнем сервере **Raspberry Pi 3 Model B**.

> Все эстимейты — для одного разработчика (вы) с парным агентом-помощником.
> Хронометраж в формате `Sx.y` = Spike (исследовательская задача), `Tx.y` = Task (реализация).

---

## Содержание

- [Цели и нецели](#цели-и-нецели)
- [Архитектура](#архитектура)
- [Stage 0 — Подготовка](#stage-0--подготовка)
- [Stage 1 — Pi и сеть](#stage-1--pi-и-сеть)
- [Stage 2 — Первый деплой статики](#stage-2--первый-деплой-статики)
- [Stage 3 — RAWG-прокси (B-Tech2)](#stage-3--rawg-прокси-b-tech2)
- [Stage 4 — Cloudflare Tunnel и домен](#stage-4--cloudflare-tunnel-и-домен)
- [Stage 5 — CI/CD из GitHub](#stage-5--cicd-из-github)
- [Stage 6 — Стабилизация и мониторинг](#stage-6--стабилизация-и-мониторинг)
- [Stage 7 — Долгий хвост (после go-live)](#stage-7--долгий-хвост-после-go-live)
- [Бюджет](#бюджет)
- [Риски](#риски)
- [Решения, которые нужны от владельца проекта](#решения-которые-нужны-от-владельца-проекта)

---

## Цели и нецели

### Цели
- PlayHub доступен по своему домену из публичного интернета 24/7
- HTTPS работает без ручных действий с сертификатами
- RAWG API-ключ скрыт от клиента (B-Tech2)
- `git push origin main` автоматически обновляет сайт
- Pi не открыт напрямую — никаких проброшенных портов на роутере

### Нецели (явно вне scope этого roadmap)
- Миграция на Next.js / SSR / SEO Phase 1 — отдельный roadmap, для Pi 3B SSR не подходит
- Замена Firebase на самохост — не нужно, Firebase бесплатный план достаточен
- Кластер из нескольких Pi — один сервер, никаких k8s
- Прод-grade observability (Grafana/Prometheus) — на старте обычные journald-логи

---

## Архитектура

```
┌────────────────────────────────────────────┐
│   Пользователь                              │
└──────────────────┬─────────────────────────┘
                   │  HTTPS (домен)
                   ▼
┌────────────────────────────────────────────┐
│   Cloudflare Edge / CDN                     │
│   - TLS termination                         │
│   - DDoS shield                             │
│   - Cache для статики                       │
└──────────────────┬─────────────────────────┘
                   │  Cloudflare Tunnel
                   │  (исходящее соединение от Pi → CF)
                   ▼
┌────────────────────────────────────────────┐
│   Raspberry Pi 3B (Ubuntu/RPi OS Lite)      │
│                                             │
│   ┌────────────────┐   ┌─────────────────┐  │
│   │ Caddy :80      │ ⇄ │ playhub-rawg    │  │
│   │ - SPA fallback │   │ Node :3001      │  │
│   │ - /api/* proxy │   │ RAWG_API_KEY    │  │
│   │ - gzip/brotli  │   │ in-memory cache │  │
│   └───────┬────────┘   └─────────────────┘  │
│           │                                 │
│           ▼                                 │
│   /var/www/playhub/  ← dist/ из репо        │
└────────────────────────────────────────────┘
                   │
                   ▼ (только Firebase Auth/Firestore)
            Google Firebase (облако)
```

### Почему именно так
- **Cloudflare Tunnel** — нет открытых портов на роутере, не зависит от провайдерского NAT, бесплатно для соло
- **Caddy** — автоматический HTTPS не нужен (TLS делает Cloudflare), но Caddy всё равно лучше nginx по простоте конфига и SPA-fallback из коробки
- **Node-прокси на :3001** — слушает только localhost, ключ в `.env`, доступ только через Caddy
- **Firebase не трогаем** — Auth/Firestore идут напрямую из браузера, Pi из этой цепочки убран

---

## Stage 0 — Подготовка

**Цель**: понять, что есть, что нужно купить.

| ID | Задача | Эстимейт | Зависимости |
|---|---|---|---|
| S0.1 | Чеклист железа: Pi 3B, БП 5V/2.5A, SD ≥16GB Class A1, Ethernet-кабель, корпус с радиатором | 15 мин | — |
| S0.2 | Выбрать домен (если ещё нет): `.app`, `.dev`, `.com` — что-то, что поддерживает Cloudflare DNS | 30 мин | — |
| S0.3 | Зарегистрировать Cloudflare-аккаунт, перенести/привязать домен (NS-делегация) | 30 мин | S0.2 |
| S0.4 | Бэкап текущей карты Pi (если на ней что-то ценное) | 30 мин | — |

**Артефакт**: список покупок + домен в Cloudflare.

---

## Stage 1 — Pi и сеть

**Цель**: чистый Pi с SSH-доступом и зафиксированным IP в локальной сети.

| ID | Задача | Эстимейт |
|---|---|---|
| T1.1 | Флэш **Raspberry Pi OS Lite 64-bit** через Raspberry Pi Imager | 20 мин |
| T1.2 | В Imager: задать hostname (`playhub`), включить SSH, прописать SSH-ключ, Wi-Fi/Ethernet, локаль | 10 мин |
| T1.3 | Первая загрузка, `ssh pi@playhub.local`, `sudo apt update && sudo apt full-upgrade -y` | 20 мин |
| T1.4 | Зафиксировать IP в роутере (DHCP reservation по MAC-адресу) | 10 мин |
| T1.5 | Поставить `ufw`, разрешить только SSH с локалки: `ufw allow from 192.168.0.0/16 to any port 22 && ufw enable` | 10 мин |
| T1.6 | Включить **zram-tools** (`sudo apt install zram-tools`) — даёт +30% эффективной памяти | 5 мин |
| T1.7 | Расширить swap до 1–2 ГБ (`/etc/dphys-swapfile` → `CONF_SWAPSIZE=2048`) | 5 мин |
| T1.8 | Поставить `htop`, `git`, `curl`, `rsync` | 5 мин |
| T1.9 | Завести непривилегированного пользователя `playhub` для деплоев, выдать ему sudo для systemd-команд | 15 мин |

**Definition of done**: `ssh playhub@<ip>` работает, `htop` показывает свободные ~700 МБ из 1 ГБ.

---

## Stage 2 — Первый деплой статики

**Цель**: открыть в браузере `http://<ip Pi>` и увидеть PlayHub.

| ID | Задача | Эстимейт |
|---|---|---|
| T2.1 | `sudo apt install caddy` (есть в стандартных репах Ubuntu/Debian) | 5 мин |
| T2.2 | Создать `/etc/caddy/Caddyfile` для SPA + gzip (см. шаблон ниже) | 15 мин |
| T2.3 | Создать `/var/www/playhub`, права `playhub:caddy` | 5 мин |
| T2.4 | Локально на ноутбуке: `npm run build`, `rsync -avz dist/ playhub@<ip>:/var/www/playhub/` | 10 мин |
| T2.5 | `sudo systemctl reload caddy`, открыть `http://<ip Pi>`, проверить что HomePage грузится | 10 мин |
| T2.6 | Проверить роутинг SPA: `http://<ip Pi>/games` отдаёт `index.html`, а не 404 | 5 мин |

**Шаблон `Caddyfile`** (минимальный, без HTTPS — пока):

```caddy
:80 {
    root * /var/www/playhub
    encode zstd gzip
    try_files {path} /index.html
    file_server
    log {
        output file /var/log/caddy/playhub-access.log
    }
}
```

**Definition of done**: PlayHub открывается с ноутбука по IP Pi, навигация работает, в Network Tab бандлы 252 кБ как и в локальной сборке.

---

## Stage 3 — RAWG-прокси (B-Tech2)

**Цель**: убрать RAWG API-ключ из клиентского бандла, ходить на RAWG через `/api/rawg/*`.

| ID | Задача | Эстимейт |
|---|---|---|
| S3.1 | Спайк: выбрать стек прокси — **Hono на Node 20** (Hono весит ~30 кБ, ESM, типизирован, идеально для Pi) | 30 мин |
| T3.2 | Создать в репо папку `deploy/rawg-proxy/`: `package.json`, `src/server.ts`, `.env.example` | 1 ч |
| T3.3 | Реализовать прокси-эндпоинт: `GET /api/rawg/*` → подменяет/добавляет `?key=...`, форвардит на `https://api.rawg.io/api/*` | 2 ч |
| T3.4 | Добавить in-memory кэш с TTL 5 мин (`lru-cache`), чтобы 1000 одинаковых запросов = 1 на RAWG | 1 ч |
| T3.5 | Добавить rate-limit (per-IP, простой in-memory bucket) | 1 ч |
| T3.6 | Поменять в клиенте `src/services/apiClient.ts`: `baseURL = '/api/rawg'`, убрать `?key=` | 1 ч |
| T3.7 | Установить Node 20 через `nodesource` на Pi (`curl -fsSL https://deb.nodesource.com/setup_20.x ...`) | 15 мин |
| T3.8 | Деплой прокси на Pi: `rsync deploy/rawg-proxy/`, `npm ci --omit=dev`, `npm run build` | 30 мин |
| T3.9 | Создать `/etc/systemd/system/playhub-proxy.service` + `EnvironmentFile=/etc/playhub/rawg.env` с RAWG_API_KEY | 30 мин |
| T3.10 | Добавить блок в Caddyfile: `reverse_proxy /api/* localhost:3001` | 15 мин |
| T3.11 | E2E тест: открыть `/games` на сайте, проверить через DevTools что запросы идут на `/api/rawg/games`, а ключа в JS нет | 30 мин |
| T3.12 | `.env` в основном репо: оставить `VITE_API_BASE_URL` для локальной разработки (без прокси на dev) | 30 мин |

**Definition of done**:
- `curl https://<домен>/api/rawg/games?page=1` возвращает JSON RAWG
- В прод-бандле `grep "VITE_RAWG_API_KEY" dist/assets/*.js` ничего не находит
- `systemctl status playhub-proxy` зелёный, потребляет <50 МБ RAM

**Артефакты**: PR `feat/b-tech2-rawg-proxy` + папка `deploy/rawg-proxy/`.

---

## Stage 4 — Cloudflare Tunnel и домен

**Цель**: PlayHub доступен в публичном интернете по своему домену с HTTPS, без открытых портов.

| ID | Задача | Эстимейт |
|---|---|---|
| T4.1 | На Pi: установить `cloudflared` (deb-пакет с сайта CF) | 15 мин |
| T4.2 | В Cloudflare dashboard → Zero Trust → Networks → Tunnels → создать новый туннель `playhub-pi` | 15 мин |
| T4.3 | Скопировать сгенерированный CF токен, выполнить `cloudflared service install <TOKEN>` на Pi | 10 мин |
| T4.4 | В UI туннеля: добавить **Public Hostname** `playhub.<домен>` → service `http://localhost:80` | 10 мин |
| T4.5 | Проверить: `https://playhub.<домен>` открывается с телефона на 4G (не из домашней сети) | 10 мин |
| T4.6 | В Cloudflare DNS убедиться что A/AAAA не висят, только CNAME от туннеля (proxied=on) | 10 мин |
| T4.7 | Включить в Cloudflare: Auto Minify, Brotli, Always Use HTTPS, HSTS (макс 6 месяцев на старте) | 20 мин |
| T4.8 | Настроить Cache Rules: `*.js, *.css, *.png` — Edge cache 1 год; `index.html` — no-cache | 30 мин |

**Definition of done**: открыть `https://playhub.<домен>` из любого места в мире, увидеть HomePage за <1 сек до первого байта.

---

## Stage 5 — CI/CD из GitHub

**Цель**: `git push origin main` → через 2 минуты сайт обновлён.

### Вариант A: GitHub Actions + SCP через Tunnel (рекомендуется)

| ID | Задача | Эстимейт |
|---|---|---|
| T5.1 | На Pi: создать deploy-юзера `deploy` с ограниченными правами (`/var/www/playhub` write + `systemctl reload caddy` через sudoers NOPASSWD) | 30 мин |
| T5.2 | Сгенерировать SSH-ключ для CI, public → в `~deploy/.ssh/authorized_keys` | 15 мин |
| T5.3 | В Cloudflare Tunnel добавить второй hostname `ssh-pi.<домен>` → service `ssh://localhost:22` (type SSH) | 15 мин |
| T5.4 | Положить private-ключ + `RAWG_API_KEY` (для тестов сборки) в GitHub Secrets | 15 мин |
| T5.5 | Написать `.github/workflows/deploy-pi.yml`: build → upload artifact → rsync через `cloudflared access ssh` или `appleboy/scp-action` | 1.5 ч |
| T5.6 | На Pi настроить `cloudflared access` со стороны клиента (Actions runner будет ходить через CF Access) | 30 мин |
| T5.7 | Прогнать пайплайн: тестовый push в main → проверить логи Actions → проверить что сайт обновился | 30 мин |
| T5.8 | Добавить шаг `deploy/rawg-proxy/` тоже: если файлы в этой папке менялись — пересобрать и `systemctl restart playhub-proxy` | 30 мин |

### Вариант B: webhook + git pull на Pi (проще, но грязнее)

- На Pi бежит лёгкий webhook-listener (`webhook` пакет или просто systemd path-unit на git poll)
- На push в main вызывается hook → `git pull && npm ci && npm run build && mv dist/* /var/www/playhub/`
- **Минус**: сборка на Pi 3B = 5–7 минут и пик RAM. Не рекомендую.

**Definition of done**: коммит → пуш → через ≤3 минут изменения на проде. Откат через `git revert` тоже работает.

---

## Stage 6 — Стабилизация и мониторинг

**Цель**: знать, когда что упало, и не упасть надолго.

| ID | Задача | Эстимейт |
|---|---|---|
| T6.1 | **Uptime monitoring**: завести бесплатный Better Stack / UptimeRobot — пинг на `https://<домен>` каждую минуту, уведомление в Telegram | 30 мин |
| T6.2 | **Логи Caddy + прокси**: ротация через `logrotate`, retention 14 дней | 30 мин |
| T6.3 | **Disk usage alert**: cron на Pi, если `/` >85% — отправить webhook (Telegram bot или email) | 30 мин |
| T6.4 | **Temperature watch**: `vcgencmd measure_temp` в cron каждые 5 минут, alert при >75°C | 30 мин |
| T6.5 | **Auto-restart**: добавить в systemd-units `Restart=always`, `RestartSec=5s` | 15 мин |
| T6.6 | **Watchdog Pi**: включить hardware watchdog (`/etc/systemd/system.conf` → `RuntimeWatchdogSec=30s`) — Pi перезагрузится сам, если зависнет | 20 мин |
| T6.7 | **Бэкап конфигов**: cron на Pi, раз в неделю `tar` → upload в GitHub приватный gist или R2 | 30 мин |
| T6.8 | **Frontend error tracking**: подключить Sentry (free tier 5k events/мес) в `main.tsx`, обернуть ErrorBoundary | 1 ч |
| T6.9 | **Pi health dashboard** (опционально): `netdata` или `glances --webserver` — но осторожно с RAM | 1 ч |

**Definition of done**: получаете push в Telegram, когда сайт лёг. Сами при этом видите причину в логах за 5 минут.

---

## Stage 7 — Долгий хвост (после go-live)

После того, как сайт стабильно работает 2 недели — можно браться за пункты, отложенные в Sprint B и далее.

### Backend-инфраструктура
- **B-Prof** — Firestore security rules для публичных коллекций (`/collection/:uid` уже есть как route)
- **Storage rules** — если будут аватары/скриншоты
- **Firebase App Check** — защита от ботов

### Качество
- **Тесты**: Vitest setup, 3-4 теста на критичные места (скоринг рекомендаций, лимит 4 в comparison, фильтры)
- **GitHub Actions CI**: `build + lint` на каждый PR (не путать с deploy)
- **Lint-warnings cleanup**: вынести хуки `useAuth/useComparison/useSearch` в отдельные файлы

### Продуктовые фичи
- Пагинация/infinite scroll на `/games`
- Screenshots/trailers/stores на странице игры (поля в типе `Game` уже есть, но не наполняются)
- Light/dark переключатель тем
- `react-i18next` для полной локализации (сейчас русский/английский вперемешку)
- Wishlist/Favorites как отдельные роуты

### SEO без Next.js
- `react-helmet-async`: title + og:image + description на каждую страницу
- Sitemap-генератор как build-step
- `prerender.io` или `vite-plugin-ssg` для статических SEO-страниц

### Когда апгрейд железа?
**Pi 4 / Pi 5** имеет смысл, если:
- Захотите Next.js SSR
- Захотите self-hosted analytics (Plausible, Umami)
- Захотите рядом крутить ещё проекты (Pi 5 8GB = домашний мини-сервер)

Пока трафик меньше 10k уников в день — Pi 3B вытащит.

---

## Бюджет

| Статья | Раз / Регулярно | Цена |
|---|---|---|
| Pi 3B | разовая (есть) | 0 ₽ |
| Качественная SD-карта 32GB A1 | разовая | ~1 500 ₽ |
| (Опц.) USB SSD 120GB + кабель | разовая | ~3 000 ₽ |
| БП 5V/2.5A качественный | разовая | ~1 000 ₽ |
| Корпус с радиатором/кулером | разовая | ~1 500 ₽ |
| Домен (`.app`/`.dev`/`.com`) | в год | ~$10–15 |
| Cloudflare Free Tier (Tunnel, DNS, CDN) | — | 0 ₽ |
| Better Stack / UptimeRobot Free | — | 0 ₽ |
| Sentry Free | — | 0 ₽ |
| Электричество (~3 Вт × 24 × 365) | в год | ~70 кВт·ч ≈ 1 500 ₽ |
| **Итого старт** | разовый | **~7 000 ₽** |
| **Итого в год** | — | **~2 500 ₽** |

---

## Риски

| Риск | Вероятность | Импакт | Митигация |
|---|---|---|---|
| SD-карта умрёт | Высокая (год-два) | Полный простой | A1/A2 карта, ежедневные бэкапы конфигов, образ ОС в облаке для быстрого восстановления |
| Провайдер заблокирует исходящие на CF | Низкая | Туннель не поднимется | Альтернатива: Tailscale Funnel |
| RAWG поменяет/ограничит API | Средняя | Сайт без данных | Кэш в Redis (если дойдём) + локальный snapshot топ-1000 игр |
| Pi перегреется летом | Средняя | Throttling/перезагрузки | Радиатор + активный кулер за 500 ₽ |
| Firebase бесплатный план кончится | Низкая (для соло-проекта) | Чтения упадут | Migrate to Spark plan лимиты или PocketBase на том же Pi |
| Электричество дома | Низкая | Простой | UPS — pi-friendly powerbank с pass-through ~3000 ₽ |
| Утечка SSH-ключа от deploy-юзера | Средняя | Деплой может сломать прод (но не root) | Deploy-юзер без sudo на opasные команды, только rsync target + reload caddy |

---

## Решения, которые нужны от владельца проекта

Перед стартом Stage 0 ответьте на 4 вопроса — от них зависят шаги:

1. **Домен**: есть уже? Какой? Где зарегистрирован? Если нет — готовы купить?
2. **Сетевое подключение Pi**: Ethernet или Wi-Fi? Провайдер даёт серый IP за NAT или белый?
3. **Хранилище**: SD-карта или USB SSD?
4. **Кому показывать**: личный pet-проект или планируете публично рекламировать? От этого зависит, нужен ли Cloudflare Pro ($20/мес за WAF/Image Optimization).

---

## Total estimate

| Этап | Время (на пары часов в день) |
|---|---|
| Stage 0 | 1 вечер |
| Stage 1 | 1 вечер |
| Stage 2 | 1 вечер |
| Stage 3 (B-Tech2) | 2 вечера |
| Stage 4 | 1 вечер |
| Stage 5 | 1–2 вечера |
| Stage 6 | 1 вечер |
| **Итого до go-live** | **~8–9 вечеров (≈2 недели по 1 ч/день)** |

Stage 7 — растягивается на месяцы по мере появления времени.

---

## Дальнейшие шаги (action items)

После прочтения и согласования этого roadmap:

1. Ответить на 4 вопроса в [Решения](#решения-которые-нужны-от-владельца-проекта)
2. Завести GitHub Issues по каждому Stage (ярлык `roadmap-pi`) — могу сделать сразу пачкой
3. Стартовать Stage 0 — список покупок
4. Прокатить вечерами Stage 1–4 — будет рабочий публичный сайт уже к концу первой недели

> Этот документ — живой. Правьте через PR, фиксируйте решения и даты.
