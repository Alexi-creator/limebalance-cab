# 🍋 LimeBalance

**LimeBalance** is a personal finance web app — your money in one clean dashboard. Track income and expenses, organize them into categories, set savings goals, follow your investment portfolio, and read it all back as charts and analytics.

This repository contains the **frontend** (the user cabinet). It talks to a separate backend over `/api`.

---

## ✨ Features

- **Dashboard** — balance overview, recent transactions, cashflow chart, goals and portfolio snippets.
- **Transactions** — add, edit and browse incomes & expenses in a sortable, paginated table.
- **Categories** — organize transactions with custom categories.
- **Analytics** — visual breakdowns of where your money goes and comes from.
- **Goals** — set and track savings targets.
- **Investments** — keep an eye on your asset portfolio.
- **Auth** — sign in with **Telegram** or **Google OAuth**, with protected/guest routing.
- **Light & dark theme** with a one-click toggle.
- **35 languages** out of the box (English, Russian, German, Spanish, French, Chinese, Japanese… ), with localized dates.

---

## 🛠 Tech Stack

| Area | Tooling |
|------|---------|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| UI | [Mantine v9](https://mantine.dev/) + [Tabler Icons](https://tabler.io/icons) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Forms & validation | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Routing | [React Router](https://reactrouter.com/) |
| i18n | [i18next](https://www.i18next.com/) / react-i18next |
| Dates | [Day.js](https://day.js.org/) + [date-fns](https://date-fns.org/) |
| Linting/format | [Biome](https://biomejs.dev/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 22+** and npm
- A running instance of the LimeBalance **backend** (defaults to `http://localhost:3000`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API endpoint. Use `/api` (Vite proxies it to the backend in dev). |
| `VITE_TELEGRAM_BOT_USERNAME` | Telegram bot username (without `@`) for the login widget. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID. |

### 3. Run the dev server

```bash
npm run dev
```

The app starts on **http://localhost:5173**. In dev, requests to `/api` are proxied to the backend (`http://localhost:3000` by default — see [vite.config.ts](vite.config.ts)).

---

## 📦 Available Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check and build the production bundle to `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Lint the project with Biome. |
| `npm run format` | Auto-format the codebase with Biome. |
| `npm run ngrok` | Expose the dev server via ngrok (handy for testing Telegram auth). |
| `npm run test:e2e` | Run the Playwright end-to-end tests. |
| `npm run test:e2e:ui` | Run the E2E tests in interactive UI mode. |

---

## 🧪 Testing

End-to-end tests are written with [Playwright](https://playwright.dev/) and live in [e2e/](e2e/). They run the real app in a browser **without a backend** — every `/api/**` request is mocked at the network layer (reusing the app's own stub data), so the suite is fast and deterministic.

```bash
npx playwright install chromium   # one-time: download the browser
npm run test:e2e                  # run the suite (auto-starts the dev server)
```

See [e2e/README.md](e2e/README.md) for how the mocking and fixtures work.

---

## 🐳 Docker

**Local development** (frontend in a container, backend on your host):

```bash
docker compose up
```

This runs the `dev` stage, mounts your source for hot reload, and proxies `/api` to `host.docker.internal:3000`.

**Production** — the multi-stage [Dockerfile](Dockerfile) builds the static SPA and serves it with **nginx**. Runtime env variables are injected at container start via [deploy/40-env-config.sh](deploy/40-env-config.sh), so the same image can be deployed to multiple environments.

```bash
docker build --target production -t limebalance-cab .
```

---

## 🌍 Internationalization

All translations live in [src/i18n/locales/](src/i18n/locales/). To add a new language, register it with a single line in `src/i18n/languages.ts` (translation file + Day.js locale + date-fns locale) — everything else (language switcher, date formatting) wires up automatically.

---

## 📁 Project Structure

```
src/
├── api/          # HTTP client, auth, transactions, query client
├── components/   # Feature & UI components (charts, sidebar, modals, forms…)
├── pages/        # Route-level pages (Home, Transactions, Analytics, Goals…)
├── layout/       # App & public layouts
├── hooks/        # Shared React hooks
├── store/        # Zustand stores
├── i18n/         # Translations & language config
├── settings/     # Routes config & app settings
├── constants/    # Env helpers and constants
├── ui/           # Reusable UI primitives
└── utils/        # Helpers
```
