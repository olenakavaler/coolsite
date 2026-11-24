# coolsite (Tusovka)

Веб-сайт для створення та перегляду подій: публічні івенти, приватні за токеном, відвідування, коментарі, авторизація.

Стек: **Next.js 14**, **React**, **Prisma** (SQLite), **Tailwind CSS**.

## Вимоги

- Node.js 18+
- npm

## Швидкий старт

```bash
# 1. Клонувати репозиторій
git clone https://github.com/olenakavaler/coolsite.git
cd coolsite

# 2. Встановити залежності
npm install

# 3. Налаштувати змінні середовища
cp .env.example .env

# 4. Створити БД і застосувати міграції
npx prisma migrate dev

# 5. (Опційно) Заповнити демо-даними
npm run prisma:seed

# 6. Запустити dev-сервер
npm run dev
```

Відкрийте [http://localhost:3000](http://localhost:3000).

## Змінні середовища

Файл `.env` (приклад у `.env.example`):

| Змінна | Опис | Приклад |
|--------|------|---------|
| `DATABASE_URL` | Шлях до SQLite БД | `file:./dev.db` |
| `SESSION_SECRET` | Секрет сесій (мін. 32 символи) | довгий випадковий рядок |
| `UPLOAD_DIR` | Папка для завантажених файлів | `./uploads` |
| `NODE_ENV` | Середовище | `development` |
| `PORT` | Порт (для production `start`) | `3000` |

## Скрипти

| Команда | Що робить |
|---------|-----------|
| `npm run dev` | Dev-сервер з hot reload |
| `npm run build` | Production-збірка |
| `npm start` | Запуск зібраного застосунку |
| `npm run lint` | ESLint |
| `npm test` | Тести (Vitest) |
| `npm run prisma:migrate` | Міграції в dev |
| `npm run prisma:seed` | Сид демо-даних |
| `npm run prisma:generate` | Генерація Prisma Client |

## Production

```bash
cp .env.example .env
# відредагуйте SESSION_SECRET і NODE_ENV=production

npm install
npx prisma migrate deploy
npm run build
npm start
```

## Структура

- `src/app` — сторінки та server actions (Next.js App Router)
- `src/components` — UI-компоненти
- `src/lib` — auth, валідація, БД, утиліти
- `prisma` — схема, міграції, seed
