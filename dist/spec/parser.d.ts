/**
 * OpenAPI Specification Parser
 *
 * Utilities for parsing and detecting OpenAPI specifications.
 */
/**
 * Check if content appears to be an OpenAPI specification.
 * Returns true only for valid OpenAPI 3.x documents.
 */
export declare function isOpenAPIContent(content: string): boolean;
/**
 * Check if a filename looks like an OpenAPI spec.
 */
export declare function isOpenAPIFilename(filename: string): boolean;
/**
 * Parse an OpenAPI specification from text.
 * Returns null if parsing fails or if it's not a valid OpenAPI spec.
 */
export declare function parseOpenAPISpec(content: string): object | null;
/**
 * Parse content as JSON or YAML, without OpenAPI validation.
 * Throws if parsing fails.
 */
export declare function parseSpec(content: string): object;
//# sourceMappingURL=parser.d.ts.map