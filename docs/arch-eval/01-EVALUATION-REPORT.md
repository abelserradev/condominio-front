# Architecture evaluation — condominio-front (Next.js)

> Reference commit: `7403117` · Date: 2026-09-13  
> Evidence: `analysis/dep_graph.json`, `analysis/arch_signals.json` (local, gitignored)

## Executive summary

El front es un **App Router monolítico** con **cero ciclos de módulo** en el grafo de imports, pero **acoplamiento temporal extremo**: casi todos los cambios de producto arrastran **`lib/api.ts`** (hotspot score 88, 22 touches) y páginas admin/reportar-pago. El grafo subestima acoplamiento porque las páginas no importan entre sí — el coupling es **vía API client + layout**. Evolucionar: **modular monolith en `lib/`** + feature folders; no micro-frontends (un solo equipo).

## Attribute scorecard

| Attribute | Verdict | Evidence |
|---|---|---|
| Coupling and boundaries | 🟡 | [METRIC: 0 cycles] pero [METRIC: 25/28 co-change pairs cross-module] |
| Cohesion and responsibility | 🔴 | [METRIC: `lib` 1123 LOC, fan-in 1] [VERIFY: `lib/api.ts` ~1176 LOC] |
| Testability | 🔴 | [METRIC: hotspot lib/api 3 fixes] [TOOL: 0 jest tests] |
| Resilience | 🟡 | Client-side retries no auditados; depende de backend |
| Data and consistency | 🟡 | Estado en páginas + localStorage admin |
| Observability | — | not evaluated (browser-only) |
| Security | 🟡 | Middleware presente; token localStorage (threat model P3 code-audit) |
| Evolvability | 🟡 | CI lint/build; cambios API centralizados en un archivo |

## Strengths

- **Sin ciclos SCC** — base sana para reglas de import.
- **Componentes compartidos** (`platform`, `recibos`, `home`) con fan-in bajo y reutilización clara en el grafo.
- **Middleware** para multi-tenant — frontera de seguridad en edge.
- **Pocas dependencias runtime** — superficie de supply chain acotada (parche Next pendiente).

## Weaknesses (ranked)

| ID | Sev | Weakness | Attribute | Evidence | Proposal |
|---|---|---|---|---|---|
| WEAK-F01 | P1 | Hub `lib/api.ts` + co-change masivo | Coupling | [METRIC: 25 cross-module pairs; api↔reportar-pago conf 0,5] | ADR-F001 |
| WEAK-F02 | P2 | Páginas >800 LOC desacopladas del grafo | Cohesion | [METRIC: orphan pages 850+ LOC] [VERIFY: reportar-pago, admin/recibos] | ADR-F002 |
| WEAK-F03 | P2 | Admin sidebar acoplado a recibos grid | Coupling | [METRIC: sidebar↔pisos-grid conf 0,8] | ADR-F002 |
| WEAK-F04 | P3 | `lib/hooks` orphan | — | [METRIC: dep_graph] | Export barrel o mover hooks junto a features |

## Dismissed findings

| Finding | Reason |
|---|---|
| Páginas como “orphan modules” | Entry points Next; no deben importarse entre rutas |
| Fan-in 0 en admin pages | Esperado en grafo estático de rutas |

## Areas not evaluated

- Playwright e2e architecture
- Micro-frontends viability (rechazado por tamaño de equipo)
