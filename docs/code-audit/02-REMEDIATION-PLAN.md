# Remediation plan — condominio-front

## Phase 0 — Guardrails

1. `.pre-commit-config.yaml` (plantilla Next.js del audit) + `pre-commit install`.
2. CI: fallar en `pnpm audit --audit-level=high` y ejecutar `jest` con al menos 1 test.
3. Pin `next` y `eslint-config-next` en la misma versión parcheada.

**Verification:** PR no mergeable con audit critical/high.

## Phase 1 — P1

### R-01 · Actualizar Next.js a ≥16.3.3

- **Fix:** `pnpm up next@^16.3.3 eslint-config-next@^16.3.3` + lockfile + smoke build.
- **Effort:** S · **Risk:** Bajo
- **Verification:** `pnpm audit --audit-level=high` → 0 critical; `pnpm build` OK

### R-02 · Tests mínimos (smoke)

- **Fix:** `lib/__tests__/api-auth.test.ts` (mock fetch); `app/reportar-pago/__tests__/validation.test.ts` para helpers extraídos.
- **Effort:** M · **Risk:** Bajo
- **Verification:** `pnpm test` → ≥5 tests, no `passWithNoTests` en CI

## Phase 2 — P2

### R-03 · Modularizar `lib/api.ts`

- **Fix:** `lib/api/payments.ts`, `recibos.ts`, `auth.ts`, barrel `lib/api/index.ts`; mantener tipos compartidos.
- **Effort:** M · **Risk:** Medio — grep todos los imports
- **Verification:** Ningún archivo api >300 LOC; tsc + lint

### R-04 · Extraer hooks/componentes de páginas >400 LOC

- **Fix:** p. ej. `useReportarPagoForm`, subcomponentes en `app/reportar-pago/components/`.
- **Effort:** L · **Risk:** Medio UX
- **Verification:** páginas críticas <400 LOC

## Phase 3 — P3

- Documentar threat model admin token; roadmap cookie httpOnly (issue separado).

## Follow-up (Gentle AI)

| Item | Repo | Acción |
|------|------|--------|
| Issue aprobado para R-01 (security) | abelserradev/condominio-front | `fix/next-security-bump` |
| Issue para R-02 tests | mismo | `feat/front-smoke-tests` |
