# ADR-F002: Feature folders para páginas monolíticas

> **Status**: proposed · **Weakness**: WEAK-F02, WEAK-F03

## Context

Páginas 850–920 LOC no aparecen en grafo de imports pero co-change admin↔recibos [METRIC: inicio↔recibos conf 0,5; sidebar↔pisos-grid 0,8].

## Decision

Patrón **feature folder** por ruta crítica: `components/`, `hooks/`, `types.ts` colocados bajo `app/<feature>/`. Layout admin comparte solo contratos tipados, no implementación de grids de recibos.

## Do nothing

Aceptable si solo hay bugfixes; insostenible para SaaS multi-tenant con más roles.

## Cost

L por reportar-pago + admin/recibos (~1 sprint total incremental).
