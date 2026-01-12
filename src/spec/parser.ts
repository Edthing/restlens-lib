/**
 * OpenAPI Specification Parser
 *
 * Utilities for parsing and detecting OpenAPI specifications.
 */

import { parse as parseYaml } from "yaml";

/**
 * Check if content appears to be an OpenAPI specification.
 * Returns true only for valid OpenAPI 3.x documents.
 */
export function isOpenAPIContent(content: string): boolean {
  // Check for OpenAPI 3.x identifier
  const oasYamlPattern = /^openapi:\s*["']?3\./m;
  const oasJsonPattern = /"openapi"\s*:\s*"3\./;

  return oasYamlPattern.test(content) || oasJsonPattern.test(content);
}

/**
 * Check if a filename looks like an OpenAPI spec.
 */
export function isOpenAPIFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".json")
  );
}

/**
 * Parse an OpenAPI specification from text.
 * Returns null if parsing fails or if it's not a valid OpenAPI spec.
 */
export function parseOpenAPISpec(content: string): object | null {
  try {
    let parsed: unknown;

    // Try JSON first
    if (content.trim().startsWith("{")) {
      parsed = JSON.parse(content);
    } else {
      // Then YAML
      parsed = parseYaml(content);
    }

    // Validate it's an object with openapi or swagger field
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      ("openapi" in parsed || "swagger" in parsed)
    ) {
      return parsed as object;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse content as JSON or YAML, without OpenAPI validation.
 * Throws if parsing fails.
 */
export function parseSpec(content: string): object {
  // Try JSON first, then YAML
  try {
    return JSON.parse(content);
  } catch {
    try {
      const result = parseYaml(content);
      if (typeof result !== "object" || result === null) {
        throw new Error("Invalid specification format. Must be a valid object.");
      }
      return result as object;
    } catch {
      throw new Error("Invalid specification format. Must be valid JSON or YAML.");
    }
  }
}
