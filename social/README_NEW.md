# Alumni Connect (Social)

React + TypeScript + Vite app powered by Supabase, MUI Joy, and React Router.

## Prerequisites

- Node 20+
- .env with Supabase keys (see `.env.example`)

## Install & Run

```powershell
npm install
npm run dev
```

## Scripts

- dev: run the app locally
- build: type-check and create a production build
- lint: run ESLint
- test: run unit tests (Vitest)
- test:ui: open Vitest UI
- test:coverage: run tests with coverage

## Testing

Vitest + React Testing Library are configured with jsdom. Tests live in `src/__tests__`.

```powershell
npm run test
```

## Architecture Notes

- State: AuthContext, ToastNotificationProvider, DatabaseNotificationProvider
- UI: MUI Joy components with a shared theme
- Routing: React Router with protected and public routes
- Types: centralized in `src/types`

## Contributing

Keep components small, typed, and documented with brief JSDoc where helpful. Prefer centralized types and avoid duplicate module variants.
