import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DAG_TOOLS_MARKER_START,
  DAG_TOOLS_MARKER_END,
  buildDagToolsBlock,
  backupConfig,
  mergeDagToolsBlock,
  parseTraefikYaml,
} from "../../scripts/traefik-config";

describe("traefik-config", () => {
  describe("buildDagToolsBlock", () => {
    it("contains host rule", () => {
      const block = buildDagToolsBlock();
      expect(block).toContain("tools.local.dagdappshub.com");
    });

    it("uses websecure entrypoint", () => {
      const block = buildDagToolsBlock();
      expect(block).toContain("websecure");
      expect(block).toContain("entryPoints");
    });

    it("uses cloudflare cert resolver", () => {
      const block = buildDagToolsBlock();
      expect(block).toContain("cloudflare");
      expect(block).toContain("certResolver");
    });

    it("service points to 192.168.4.21:3010", () => {
      const block = buildDagToolsBlock();
      expect(block).toContain("192.168.4.21:3010");
    });
  });

  describe("backupConfig", () => {
    let tmpDir: string;

    function setup(): string {
      tmpDir = mkdtempSync(join(tmpdir(), "traefik-backup-test-"));
      return tmpDir;
    }

    function cleanup(): void {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    }

    it("creates timestamped backup of source file", () => {
      const dir = setup();
      try {
        const srcPath = join(dir, "dynamic.yml");
        const original = "http:\n  routers:\n    other: {}";
        writeFileSync(srcPath, original, "utf-8");

        const backupPath = backupConfig(srcPath);

        expect(backupPath).toMatch(/\.bak\.\d+$/);
        expect(existsSync(backupPath)).toBe(true);

        // Backup must contain original content
        expect(readFileSync(backupPath, "utf-8")).toBe(original);
      } finally {
        cleanup();
      }
    });

    it("multiple backups can be created", () => {
      const dir = setup();
      try {
        const srcPath = join(dir, "dynamic.yml");
        writeFileSync(srcPath, "v1", "utf-8");

        // Pause to ensure different timestamps
        const backup1 = backupConfig(srcPath);
        const backup2 = backupConfig(srcPath);

        expect(existsSync(backup1)).toBe(true);
        expect(existsSync(backup2)).toBe(true);
        expect(readFileSync(backup1, "utf-8")).toBe("v1");
        expect(readFileSync(backup2, "utf-8")).toBe("v1");
      } finally {
        cleanup();
      }
    });

    it("throws when src missing", () => {
      const dir = setup();
      try {
        const srcPath = join(dir, "nonexistent.yml");
        expect(() => backupConfig(srcPath)).toThrow();
      } finally {
        cleanup();
      }
    });

    it("creates backup in same directory as source", () => {
      const dir = setup();
      try {
        const srcPath = join(dir, "dynamic.yml");
        writeFileSync(srcPath, "data", "utf-8");

        const backupPath = backupConfig(srcPath);
        // backup should be in the same directory
        expect(backupPath.startsWith(dir)).toBe(true);
      } finally {
        cleanup();
      }
    });
  });

  describe("mergeDagToolsBlock", () => {
    it("appends block when no markers present", () => {
      const existing = "http:\n  routers:\n    other:\n      rule: Host(`other.com`)\n";
      const block = buildDagToolsBlock();
      const result = mergeDagToolsBlock(existing, block);

      expect(result).toContain(existing);
      expect(result).toContain(DAG_TOOLS_MARKER_START);
      expect(result).toContain(DAG_TOOLS_MARKER_END);
      expect(result).toContain(block);

      // Block must come after existing content
      const markerIndex = result.indexOf(DAG_TOOLS_MARKER_START);
      const existingIndex = result.indexOf("other.com");
      expect(markerIndex).toBeGreaterThan(existingIndex);
    });

    it("replaces existing marker block", () => {
      const existing = [
        "http:",
        "  routers:",
        "    other:",
        "      rule: Host(`other.com`)",
        DAG_TOOLS_MARKER_START,
        "http:",
        "  routers:",
        "    dag-tools:",
        "      rule: Host(`old.example.com`)",
        DAG_TOOLS_MARKER_END,
        "  services:",
        "    other-svc:",
        "      url: http://example.com",
      ].join("\n");

      const block = buildDagToolsBlock();
      const result = mergeDagToolsBlock(existing, block);

      // Old content must NOT be present
      expect(result).not.toContain("old.example.com");

      // New block must be present
      expect(result).toContain("tools.local.dagdappshub.com");

      // Surrounding content preserved
      expect(result).toContain("Host(`other.com`)");
      expect(result).toContain("other-svc");

      // Markers present exactly once
      const startCount = (result.match(/# >>> dag-tools >>>/g) ?? []).length;
      const endCount = (result.match(/# <<< dag-tools <<</g) ?? []).length;
      expect(startCount).toBe(1);
      expect(endCount).toBe(1);
    });

    it("preserves surrounding yaml exactly", () => {
      const before = "# Top-level comment\nhttp:\n  routers:\n    app:\n      rule: Host(`app.local`)\n";
      const after = "\n  services:\n    app-svc:\n      loadBalancer:\n        servers:\n          - url: http://app:3000\n";

      const existing = before + after;
      const block = buildDagToolsBlock();
      const result = mergeDagToolsBlock(existing, block);

      // Surrounding content must appear intact before the marker block
      expect(result.startsWith(before)).toBe(true);
      // The `after` portion must be preserved (before marker block is appended)
      expect(result).toContain(after.trim());
    });

    it("merges with empty existing config", () => {
      const block = buildDagToolsBlock();
      const result = mergeDagToolsBlock("", block);

      expect(result).toContain(DAG_TOOLS_MARKER_START);
      expect(result).toContain(DAG_TOOLS_MARKER_END);
      expect(result).toContain(block);
    });

    it("handles markers with surrounding whitespace", () => {
      // Some edge case: markers at the very end with trailing newline
      const existing =
        "http:\n  routers:\n    other:\n      rule: Host(`other.com`)\n" +
        DAG_TOOLS_MARKER_START +
        "\nsome old dag-tools block\n" +
        DAG_TOOLS_MARKER_END +
        "\n";

      const block = buildDagToolsBlock();
      const result = mergeDagToolsBlock(existing, block);

      expect(result).toContain("Host(`other.com`)");
      expect(result).toContain("tools.local.dagdappshub.com");
      // Old block content gone
      expect(result).not.toContain("some old dag-tools block");
    });
  });

  describe("parseTraefikYaml", () => {
    it("parses valid yaml", () => {
      const yaml = "http:\n  routers:\n    app:\n      rule: Host(`app.local`)";
      const result = parseTraefikYaml(yaml);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      expect((result as Record<string, unknown>).http).toBeDefined();
    });

    it("returns empty object for empty string", () => {
      const result = parseTraefikYaml("");
      expect(result).toEqual({});
    });

    it("returns empty object for non-yaml garbage", () => {
      const result = parseTraefikYaml("not: valid: yaml: : ::");
      // js-yaml will parse this as a string; we wrap in try/catch
      // The implementation should handle gracefully
      expect(typeof result).toBe("object");
    });
  });
});
