# Architecture migration plan — condominio-front

> Strategy: **evolve in place** — split `lib/api` + feature hooks; Next sigue como único deploy.

## Phase 1: Guardrails

- ESLint `import/no-cycle` en `lib/**`.
- Regla CI: ningún archivo en `lib/` >400 LOC (warn → error tras split).
- 3 smoke tests en `lib/api/__tests__/` (auth headers, CSRF helper, base URL).

**Done:** `lib/api.ts` no crece; tests obligatorios en CI.

## Phase 2: Split API por bounded context (ADR-F001)

`lib/api/payments.ts`, `recibos.ts`, `auth.ts`, `super.ts`, `index.ts` re-export backward compatible.

**Metric:** dep_graph `lib` → varios submodules; co-change api↔pages baja en siguiente ventana git.

## Phase 3: Feature extraction (ADR-F002)

- `app/reportar-pago/hooks/use-reportar-pago.ts` + componentes
- `app/admin/recibos/components/*`

**Done:** páginas críticas <400 LOC.

## Rollback

Cada fase = PR independiente; barrel `lib/api/index.ts` mantiene imports viejos hasta migración completa.
