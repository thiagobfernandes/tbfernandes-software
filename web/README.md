# web

Next.js frontend for TBFernandes Software.

- `npm run dev`: development server on http://localhost:3000
- `npm run build`: production build
- `npm run lint`: ESLint

Structure follows the frontend architecture doc: thin routes in `src/app`, feature code in `src/features/<feature>`, shell in `src/components/layout`, shared pieces in `src/components/shared`, shadcn/ui primitives in `src/components/ui`. Theme tokens live in `src/app/globals.css`.

shadcn/ui components are added with `npx shadcn@latest add <component>` (configured in `components.json`).

## Simulated data

Until the Spring Boot API exists, every module reads and writes a client store
(`src/lib/sample-data/store.ts`) seeded from `src/lib/sample-data/*` and saved in
the browser's localStorage. Settings → Sample data resets it. When an endpoint
lands, replace that module's `dataActions` calls with API calls.

Simple create/edit forms are described as field config plus a zod schema and
rendered by `components/shared/entity-form-dialog.tsx`.
