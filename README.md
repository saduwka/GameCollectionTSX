# 🎮 PlayHub

🔗 **[Live Demo](https://gamecollection-ff71a.web.app)**

**PlayHub** — это современное веб-приложение для геймеров, позволяющее превратить вашу игровую библиотеку в структурированную коллекцию с глубокой аналитикой, рекомендациями и поиском лучших цен.

![PlayHub Preview](https://via.placeholder.com/1200x600?text=PlayHub+Project+Preview](https://github.com/saduwka/GameCollectionTSX/issues/21#issue-5415128392)

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
   git clone https://github.com/your-username/playhub.git
   cd playhub
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   Создайте файл `.env` в корневой директории и добавьте ваши ключи:
   ```env
   VITE_RAWG_API_KEY=your_rawg_key
   VITE_FIREBASE_API_KEY=your_firebase_key
   # ... и другие параметры Firebase
   ```

4. **запустите проект:**
   ```bash
   npm run dev
   ```

---

## 🗺 Дорожная карта (Roadmap)

Подробный план развития проекта доступен в файле [ROADMAP.md](./ROADMAP.md).

---

## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле [LICENSE](./LICENSE.txt).
