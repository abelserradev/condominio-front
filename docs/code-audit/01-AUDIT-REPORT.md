# Code and security audit — condominio-front (Next.js 16)

**Date:** 2026-09-13 · **Stack:** Next.js 16 App Router, React 19, Tailwind 4 · **Audited commit:** `7403117`  
**Tools executed:** detect_stack.py, tsc, eslint, jest, jscpd, pnpm audit  
**Not executed:** gitleaks, hadolint, semgrep, Playwright (no instalados en entorno de auditoría)

## Executive summary

El frontend mantiene **duplicación muy baja** y pasa typecheck/lint, pero **no hay tests** (Jest configurado con `passWithNoTests`) y **`next@16.3.0` tiene 2 CVE critical** corregidas en ≥16.3.3. La capa `lib/api.ts` (~1,2k líneas) concentra demasiadas responsabilidades (SRP en rojo para el cliente HTTP). Prioridad: parche de Next, luego tests smoke de rutas críticas y trocear `api.ts`.

## Scorecard

| # | Dimension | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | DRY | 🟢 | [TOOL: jscpd `app lib` → 0,89 % líneas duplicadas — `analysis/jscpd-front-console.txt`] |
| 2 | SOLID | 🔴 | S🔴 I🟡 — [VERIFY: `lib/api.ts` ~1176 LOC; páginas `reportar-pago` ~921, `admin/recibos` ~902] |
| 3 | Unit tests | 🔴 | [TOOL: `jest --passWithNoTests` → No tests found — `analysis/jest-front.txt`] |
| 4 | Integration tests | 🔴 | [GAP: sin Playwright/route tests; CI solo lint/typecheck/build] |
| 5 | SAST | ⚪ | not evaluated (tooling) |
| 6 | SCA | 🔴 | [TOOL: pnpm audit → 2 critical en `next` 16.3.0 (<16.3.3) — `analysis/pnpm-audit-front.txt`] |
| 7 | Secrets | ⚪ | not evaluated (tooling); `.gitignore` cubre `.env*` |
| 8 | Containers | 🟡 | [VERIFY: Dockerfile presente; hadolint no ejecutado] |

## Strengths

- **Cliente API centralizado** en `lib/api.ts` (CSRF, auth headers) — buena intención DRY vs duplicar fetch en páginas.
- **Middleware** (`middleware.ts`) para rutas multi-tenant / admin.
- **CI** con lint, typecheck y build en `.github/workflows/ci.yml`.
- **DRY excelente** (<1 % duplicación jscpd).
- **Dependencias acotadas** (pocas libs de runtime).

## Findings

### P1 — Next.js con CVE critical (RCE)

- **Dimension:** 6 · **Evidence:** [TOOL: pnpm audit → GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4; `next@16.3.0`, patched ≥16.3.3]
- **Impact:** RCE no autenticado en escenarios de despliegue afectados por advisories oficiales.
- **Fix:** → REMEDIATION-PLAN R-01

### P1 — Cero tests automatizados

- **Dimension:** 3 · **Evidence:** [TOOL: jest → "No tests found" — `analysis/jest-front.txt`]
- **Impact:** Regresiones en reportar pago, recibos y login admin sin red de seguridad.
- **Fix:** → REMEDIATION-PLAN R-02

### P2 — God module `lib/api.ts`

- **Dimension:** 2 · **Evidence:** [VERIFY: `lib/api.ts` ~1176 LOC — único punto para banks, payments, recibos, super, branding]
- **Impact:** Cambios de contrato backend requieren editar un archivo masivo; difícil code review.
- **Fix:** → REMEDIATION-PLAN R-03

### P2 — Páginas UI monolíticas

- **Dimension:** 2 · **Evidence:** [VERIFY: `app/reportar-pago/page.tsx` ~921 LOC; `app/admin/recibos/page.tsx` ~902 LOC]
- **Impact:** Mezcla presentación + orquestación + validación cliente.
- **Fix:** → REMEDIATION-PLAN R-04

### P3 — Token admin en localStorage

- **Dimension:** 5 · **Evidence:** [VERIFY: patrón documentado en AGENTS legacy — revisar `lib/api.ts` getAuthToken]
- **Impact:** XSS robaría sesión admin (mitigación: CSP, sanitización).
- **Fix:** Valorar httpOnly cookie vía BFF — esfuerzo L; P3 mientras CSP estricta en prod.

## Discarded findings

| Report | Reason |
|--------|--------|
| Duplicación menor entre páginas admin | jscpd <1 %; clones son UI repetida aceptable a corto plazo |
