#!/usr/bin/env node
/**
 * Upserts a dot-path key into every *.json dictionary file under --dir.
 * Uses --translations JSON object: { "de": "...", "fr": "..." } or --translationsFile.
 * --sourceLocale + --sourceValue set the value for the source locale file.
 * Locales missing from --translations get empty string if --fallbackMode empty,
 * or the source value if --fallbackMode source (avoid for i18n batches).
 */
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") out.dir = argv[++i];
    else if (a === "--keyPath") out.keyPath = argv[++i];
    else if (a === "--sourceLocale") out.sourceLocale = argv[++i];
    else if (a === "--sourceValue") out.sourceValue = argv[++i];
    else if (a === "--translations") out.translations = JSON.parse(argv[++i]);
    else if (a === "--translationsFile")
      out.translations = JSON.parse(fs.readFileSync(path.resolve(argv[++i]), "utf8"));
    else if (a === "--fallbackMode") out.fallbackMode = argv[++i];
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!out.dir || !out.keyPath || !out.sourceLocale || out.sourceValue === undefined)
    throw new Error("Required: --dir --keyPath --sourceLocale --sourceValue");
  if (!out.translations || typeof out.translations !== "object")
    throw new Error("Required: --translations '{...}' or --translationsFile path.json");
  out.fallbackMode = out.fallbackMode ?? "empty";
  return out;
}

function setDeep(obj, parts, value) {
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || typeof cur[p] !== "object" || Array.isArray(cur[p]))
      cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

const args = parseArgs(process.argv);
const dir = path.resolve(args.dir);
const parts = args.keyPath.split(".");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort();

for (const file of files) {
  const locale = file.replace(/\.json$/i, "");
  const fp = path.join(dir, file);
  const raw = fs.readFileSync(fp, "utf8");
  const data = JSON.parse(raw);
  let value;
  if (locale === args.sourceLocale) value = args.sourceValue;
  else if (Object.hasOwn(args.translations, locale)) value = args.translations[locale];
  else if (args.fallbackMode === "source") value = args.sourceValue;
  else if (args.fallbackMode === "empty") value = "";
  else throw new Error(`Unknown fallbackMode: ${args.fallbackMode}`);
  setDeep(data, parts, value);
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.error(`Upserted ${args.keyPath} across ${files.length} files in ${dir}`);
