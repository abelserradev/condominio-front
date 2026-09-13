# Architecture migration plan — condominio-front

> Strategy: **evolve in place** — split `lib/api` + feature hooks; Next sigue como único deploy.

## Phase 1: Guardrails ✅ (2026-09-13)

- ESLint `import/no-cycle` en `lib/**`.
- CI `pnpm run lib:size`: ningún archivo en `lib/` >400 LOC (excepto `lib/api.ts` hasta ADR-F001).
- Smoke tests: `lib/api/client-core.ts` + `lib/api/__tests__/` (base URL, auth headers, CSRF).
- Jest con `ts-jest` para TypeScript en tests.

**Done:** `lib/api.ts` no crece; tests y `lib:size` en CI.

## Phase 2: Split API por bounded context (ADR-F001) ✅ (2026-09-13)

Módulos en `lib/api/`: `http-session`, `auth`, `portal`, `payments`, `recibos`, `apartments`, `avisos`, `super`, `owners` + barrel `index.ts`. `@/lib/api` → re-export del barrel.

**Metric:** `lib/api.ts` <5 LOC; ningún submodule >400 LOC salvo evolución futura de `recibos`.

## Phase 3: Feature extraction (ADR-F002) — en progreso (2026-09-13)

- `reportar-pago`: bootstrap, `use-reportar-pago-deuda`, `use-comprobante-upload`, utils/comprobante, componentes (comprobante, meses/recibos, campos, ubicación)
- `admin/recibos`: listas, modales (`cargar-recibo`, confirmación pago), `recibo-pago-links`, `utils/display`

**Métrica:** `app/reportar-pago/page.tsx` y `app/admin/recibos/page.tsx` **<400 LOC** (guardrail `lib:size` no aplica a `app/`; revisión manual en PR).

## Rollback

Cada fase = PR independiente; barrel `lib/api/index.ts` mantiene imports viejos hasta migración completa.
