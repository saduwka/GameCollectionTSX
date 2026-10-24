# 🎮 gameevening

🔗 **[Live Demo](https://gamecollection-ff71a.web.app)**

**gameevening** — это современное веб-приложение для геймеров, позволяющее превратить вашу игровую библиотеку в структурированную коллекцию с глубокой аналитикой, рекомендациями и поиском лучших цен.

![gameevening Preview](https://private-user-images.githubusercontent.com/159795785/649623342-a4d0c62f-0e45-4650-863a-b0c2b8c425de.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODkwNjAzMTcsIm5iZiI6MTc4OTA2MDAxNywicGF0aCI6Ii8xNTk3OTU3ODUvNjQ5NjIzMzQyLWE0ZDBjNjJmLTBlNDUtNDY1MC04NjNhLWIwYzJiOGM0MjVkZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTEwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkxMFQxNzA2NTdaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT05N2VhMGEyNDIzZjU1NzI0Y2MzNTUyN2Y5MTEwYWZhMzAxYTA2N2EwOTUzMGFlOTk0OGE5ZDA0NmE4YTZhNzg3JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.ICVQFCl7SocMvTaQRcx9iRpWYa2ItB4Xt-eG9LvppEg)

---

## ✨ Основные возможности

### 📚 Управление коллекцией
- **Трекинг статусов:** Разделяйте игры на `Backlog`, `Playing`, `Completed`, `Dropped` и `Wishlist`.
- **Персональные заметки:** Сохраняйте свои мысли и впечатления о каждой игре.
- **Логирование времени:** Указывайте количество часов, проведенных в игре.
- **Личный рейтинг:** Ставьте оценки (1–10) и отслеживайте средний балл своей библиотеки.

### 🔍 Discovery и Аналитика
- **Глобальный поиск:** Доступ к базе из 500,000+ игр через RAWG API.
- **Умные фильтры:** Фильтрация по жанрам, годам, платформам и времени прохождения.
- **Surprise Me!:** Генератор случайной игры на основе ваших интересов и имеющегося железа.
- **Рекомендации:** Система предлагает игры на основе ваших любимых жанров.

### 💰 Покупки и Ретро
- **Price Comparison:** Сравнение цен в реальном времени через CheapShark API (Steam, GOG, Epic и др.).
- **Subscription Tags:** Метки доступности игр в Xbox Game Pass и PS Plus.
- **Retro Integration:** быстрые ссылки на Internet Archive для классических игр (MS-DOS и старые консоли).

### 👥 Социальные функции
- **Public Profiles:** Делитесь своей коллекцией с друзьями через уникальную ссылку.
- **Hardware Profile:** укажите свои консоли и девайсы для персонализации выдачи.

---

## 🚀 Технологический стек

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Сборка:** [Vite](https://vitejs.dev/)
- **Backend/Database:** [Firebase](https://firebase.google.com/) (Firestore, Auth)
- **API:** [RAWG API](https://rawg.io/apidocs), [CheapShark API](https://apidocs.cheapshark.com/)
- **UI & Styling:** Vanilla CSS (Modules), [React Hot Toast](https://react-hot-toast.com/)
- **Navigation:** React Router 7

---

## 🛠 Установка и запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/saduwka/GameCollectionTSX.git
   cd GameCollectionTSX
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   Создайте файл `.env` в корневой директории и добавьте ключи Firebase (`VITE_FIREBASE_API_KEY` и остальные).
   Ключ RAWG в клиентский бандл не попадает. Адрес прокси:
   ```env
   VITE_RAWG_PROXY_URL=http://127.0.0.1:8787
   ```
   Сам ключ положите в `workers/rawg-proxy/.dev.vars` (файл не коммитится):
   ```env
   RAWG_API_KEY=your_rawg_key
   ```

4. **Запустите прокси и приложение:**
   ```bash
   cd workers/rawg-proxy && npm install && npx wrangler dev
   ```
   В другом терминале из корня репозитория:
   ```bash
   npm run dev
   ```
   Боевой адрес Worker (`https://playhub-rawg.<аккаунт>.workers.dev`) подставляется в `VITE_RAWG_PROXY_URL` после `npx wrangler login`, `npx wrangler secret put RAWG_API_KEY` и `npx wrangler deploy`. Правила Firestore выкладываются отдельно: `firebase deploy --only firestore:rules`.

5. **Выложите сайт с пререндером:**
   ```bash
   npm run build:seo
   firebase deploy --only hosting
   ```
   `build:seo` собирает `dist`, прогоняет пререндер и пишет `sitemap-index.xml`. В `robots.txt` одна строка `Sitemap:` на этот индекс. Карту не нужно заново отправлять в Search Console при каждом деплое. Пререндер игр ограничен 300 адресами и останавливает новые карточки, если прогон игр идёт дольше 9 минут. Фактическое число смотри в строке `prerendered N urls`.

---

## 🗺 Дорожная карта (Roadmap)

Подробный план развития проекта доступен в файле [ROADMAP.md](./ROADMAP.md).

---

## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле [LICENSE](./LICENSE.txt).
