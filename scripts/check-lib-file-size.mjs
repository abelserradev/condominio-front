#!/usr/bin/env node
/**
 * Evita que crezcan archivos en lib/ mientras lib/api.ts sigue monolítico (ADR-F001).
 */
import fs from "node:fs";
import path from "node:path";

const LIB_ROOT = path.join(process.cwd(), "lib");
const MAX_LINES = 400;
const GRANDFATHER = new Set(["lib/api.ts"]);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

const offenders = [];
for (const file of walk(LIB_ROOT)) {
  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/");
  if (GRANDFATHER.has(rel)) {
    continue;
  }
  const lines = fs.readFileSync(file, "utf8").split("\n").length;
  if (lines > MAX_LINES) {
    offenders.push({ rel, lines });
  }
}

if (offenders.length) {
  console.error(
    `[lib-size] Archivos en lib/ superan ${MAX_LINES} LOC (excepto lib/api.ts):`,
  );
  for (const o of offenders) {
    console.error(`  - ${o.rel}: ${o.lines} líneas`);
  }
  process.exit(1);
}

console.log(`[lib-size] OK: ningún archivo nuevo en lib/ > ${MAX_LINES} LOC.`);
