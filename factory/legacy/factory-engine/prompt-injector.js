// LEGACY MODULE — TO BE REFACTORED UNDER V3.0 RULES

export function injectSystemPrompt(template, prompt) {
  return template
    .replace(/__SYSTEM_PROMPT__/g, prompt.replace(/\`/g, "\\`"))
    .replace(/\$/g, "\\$");
}

export function replacePlaceholders(str, map) {
  return Object.entries(map).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`__${k}__`, "g"), v),
    str
  );
}