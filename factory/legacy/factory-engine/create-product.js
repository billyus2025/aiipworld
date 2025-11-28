// LEGACY MODULE — TO BE REFACTORED UNDER V3.0 RULES

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { injectSystemPrompt, replacePlaceholders } from "./prompt-injector.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function readTemplate(type) {
  // type is either "frontend" or "worker"
  if (type === "frontend") {
    // Located in ip-factory/frontend/templates/legacy/product-index.html
    // __dirname is ip-factory/factory/legacy/factory-engine
    return fs.readFileSync(path.join(__dirname, "../../../frontend/templates/legacy/product-index.html"), "utf8");
  } else if (type === "worker") {
    // Located in ip-factory/factory/legacy/templates/worker.js
    return fs.readFileSync(path.join(__dirname, "../templates/worker.js"), "utf8");
  }
  return "";
}

function write(p, c) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, c);
  console.log("Created:", p);
}

function main() {
  const [name, slug, color, prompt] = process.argv.slice(2);
  if (!name || !slug || !color || !prompt) {
    console.log('Usage: node create-product.js "Name" slug "#color" "Prompt"');
    process.exit(1);
  }

  const model = "gpt-4.1-mini";
  // Output to data/legacy/[slug]
  const base = path.join("data", "legacy", slug);

  // FRONTEND
  let front = readTemplate("frontend");
  front = replacePlaceholders(front, {
    PRODUCT_NAME: name,
    PRODUCT_DESCRIPTION: `AI tool for ${name}`,
    THEME_COLOR: color,
    MODEL_NAME: model
  });
  write(path.join(base, "frontend/index.html"), front);

  // WORKER
  let worker = readTemplate("worker");
  worker = replacePlaceholders(worker, {
    PRODUCT_NAME: name,
    PRODUCT_SLUG: slug,
    THEME_COLOR: color,
    MODEL_NAME: model
  });
  worker = injectSystemPrompt(worker, prompt);
  write(path.join(base, "worker/worker.js"), worker);

  // CONFIG
  write(
    path.join(base, "product.config.json"),
    JSON.stringify({ name, slug, color, model, prompt }, null, 2)
  );

  console.log("\n🎉 Product Generated:", slug);
}

main();