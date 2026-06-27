import { copyFileSync, writeFileSync } from "node:fs";
import { load } from "js-yaml";

export const DAG_TOOLS_MARKER_START = "# >>> dag-tools >>>";
export const DAG_TOOLS_MARKER_END = "# <<< dag-tools <<<";

/** Build the dag-tools Traefik router + service YAML block. */
export function buildDagToolsBlock(): string {
  return [
    "http:",
    "  routers:",
    "    dag-tools:",
    "      rule: \"Host(`tools.local.dagdappshub.com`)\"",
    "      entryPoints: [websecure]",
    "      tls:",
    "        certResolver: cloudflare",
    "      service: dag-tools",
    "  services:",
    "    dag-tools:",
    "      loadBalancer:",
    "        servers:",
    "          - url: \"http://192.168.4.21:3010\"",
  ].join("\n");
}

/**
 * Create a timestamped backup of the config file.
 * Returns the backup file path.
 */
export function backupConfig(srcPath: string): string {
  const ts = Date.now();
  const backupPath = `${srcPath}.bak.${ts}`;
  copyFileSync(srcPath, backupPath);
  return backupPath;
}

/**
 * Merge the dag-tools block into existing Traefik dynamic config text.
 *
 * - If both markers exist: replaces content between them (inclusive).
 * - Otherwise: appends the block wrapped in markers at the end.
 */
export function mergeDagToolsBlock(
  existingYamlText: string,
  block: string,
): string {
  const startIdx = existingYamlText.indexOf(DAG_TOOLS_MARKER_START);
  const endIdx = existingYamlText.indexOf(DAG_TOOLS_MARKER_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace marker region
    const before = existingYamlText.slice(0, startIdx);
    const after = existingYamlText.slice(
      endIdx + DAG_TOOLS_MARKER_END.length,
    );
    return before + DAG_TOOLS_MARKER_START + "\n" + block + "\n" + DAG_TOOLS_MARKER_END + after;
  }

  // Append at end
  const markerBlock =
    DAG_TOOLS_MARKER_START + "\n" + block + "\n" + DAG_TOOLS_MARKER_END;
  if (existingYamlText === "") {
    return markerBlock;
  }
  return existingYamlText + "\n\n" + markerBlock;
}

/**
 * Write content to a file synchronously.
 */
export function writeConfig(path: string, content: string): void {
  writeFileSync(path, content, "utf-8");
}

/**
 * Parse Traefik YAML text into an object. Returns empty object on failure.
 */
export function parseTraefikYaml(text: string): unknown {
  try {
    const result = load(text);
    if (result === null || result === undefined) return {};
    if (typeof result !== "object") return {};
    return result;
  } catch {
    return {};
  }
}
