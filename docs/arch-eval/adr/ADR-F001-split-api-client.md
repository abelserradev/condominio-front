# ADR-F001: Dividir lib/api por contexto de dominio

> **Status**: accepted · **Weakness**: WEAK-F01 (mitigado 2026-09-13)

## Context

`lib/api.ts` hotspot 88 [METRIC: arch_signals]; co-change con reportar-pago, registro, login [METRIC]. 1123 LOC en módulo `lib` [METRIC: dep_graph].

## Decision

Modular monolith client-side: un archivo por bounded context alineado con backend (payments, administracion/recibos, auth, super, platform). Barrel export preserva `@/lib/api` imports.

## Alternatives

| Alt | Pros | Cons |
|-----|------|------|
| A Split (propuesta) | Menor blast radius por PR backend | Migración imports gradual |
| B React Query por dominio | Cache unificado | Nueva dependencia + curva |
| C Do nothing | Cero esfuerzo | Cada endpoint sigue tocando 1176 LOC |

## Verification

jscpd + LOC cap; 5+ unit tests en helpers extraídos.
