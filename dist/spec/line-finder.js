/**
 * Line Finder
 *
 * Finds the line number for a violation in an OpenAPI specification.
 * Used for mapping violations to source locations in editors and CI output.
 */
/**
 * Find the line position for a violation in the spec content.
 */
export function findViolationLine(key, content, message) {
    const lines = content.split("\n");
    // Default position (first line)
    const defaultPos = {
        line: 1,
        column: 0,
        endColumn: lines[0]?.length || 0,
    };
    try {
        switch (key.violation_key_type) {
            case "operation_id":
                return findOperationIdLine(key.operation_id, key.path, content, lines) || defaultPos;
            case "path":
                return findPathLine(key.path, content, lines, message) || defaultPos;
            case "schema_path":
                return findSchemaLine(key.schema_path, content, lines, message) || defaultPos;
            case "http_code":
                return findHttpCodeLine(key.http_code, key.path, key.operation_id, content, lines) || defaultPos;
            case "tag":
                return findTagLine(key.tag, content, lines) || defaultPos;
            case "info":
                return findInfoLine(content, lines) || defaultPos;
            case "system":
                // System-level violations go at the top of the file
                return defaultPos;
            default:
                return defaultPos;
        }
    }
    catch {
        return defaultPos;
    }
}
/**
 * Convert a list of ViolationKV to flat violations with line numbers.
 */
export function flattenViolationsWithLines(violations, content) {
    const result = [];
    for (const violation of violations) {
        const { key, value } = violation;
        for (const v of value) {
            // Find line for this specific violation (using message to help locate)
            const pos = findViolationLine(key, content, v.message);
            result.push({
                key,
                line: pos.line,
                column: pos.column,
                ruleId: v.rule_slug || String(v.rule_id),
                ruleName: v.rule_slug || `rule-${v.rule_id}`,
                message: v.message,
                severity: v.severity || "warning",
            });
        }
    }
    return result;
}
/**
 * Build a summary of violations.
 */
export function buildViolationSummary(violations) {
    const byRule = new Map();
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    for (const v of violations) {
        if (v.severity === "error")
            errorCount++;
        else if (v.severity === "warning")
            warningCount++;
        else
            infoCount++;
        const existing = byRule.get(v.ruleId);
        if (existing) {
            existing.count++;
        }
        else {
            byRule.set(v.ruleId, {
                ruleId: v.ruleId,
                ruleName: v.ruleName,
                severity: v.severity,
                count: 1,
            });
        }
    }
    return {
        totalViolations: violations.length,
        errorCount,
        warningCount,
        infoCount,
        byRule: Array.from(byRule.values()).sort((a, b) => b.count - a.count),
    };
}
// =============================================================================
// Position Finding Functions
// =============================================================================
/**
 * Find line for an operation (by operation_id or path+method).
 */
function findOperationIdLine(operationId, path, content, lines) {
    if (operationId) {
        // Search for operationId in content
        const patterns = [
            `operationId: ${operationId}`,
            `operationId: "${operationId}"`,
            `operationId: '${operationId}'`,
            `"operationId": "${operationId}"`,
        ];
        for (const pattern of patterns) {
            const index = content.indexOf(pattern);
            if (index !== -1) {
                return indexToLinePosition(index, pattern.length, lines);
            }
        }
    }
    // Fall back to path
    if (path) {
        return findPathLine(path, content, lines);
    }
    return null;
}
/**
 * Find line for a path definition.
 * Only searches within the "paths:" section to avoid matching schema refs.
 */
function findPathLine(path, content, lines, message) {
    // Find the paths section boundaries
    const pathsMatch = content.match(/^paths:\s*$/m);
    const jsonPathsMatch = content.match(/"paths"\s*:\s*\{/);
    if (!pathsMatch && !jsonPathsMatch)
        return null;
    const pathsIndex = pathsMatch ? content.indexOf(pathsMatch[0]) : content.indexOf('"paths"');
    if (pathsIndex === -1)
        return null;
    // Find the end of paths section (next top-level key like "components:" or end of file)
    const afterPaths = content.slice(pathsIndex);
    const nextSectionMatch = afterPaths.match(/\n[a-zA-Z][a-zA-Z0-9]*:/);
    const pathsEndIndex = nextSectionMatch
        ? pathsIndex + (nextSectionMatch.index || afterPaths.length)
        : content.length;
    // Only search within the paths section
    const pathsSection = content.slice(pathsIndex, pathsEndIndex);
    const pathsSectionStart = pathsIndex;
    // If we have a path, search for it
    if (path) {
        // Search for path key with proper indentation
        const patterns = [
            `\n  ${path}:`, // YAML with 2-space indent
            `\n    ${path}:`, // YAML with 4-space indent
            `"${path}":`, // JSON style
            `'${path}':`, // Single-quoted
        ];
        for (const pattern of patterns) {
            const relativeIndex = pathsSection.indexOf(pattern);
            if (relativeIndex !== -1) {
                const absoluteIndex = pathsSectionStart + relativeIndex;
                // Adjust for leading newline in pattern
                const adjustedIndex = pattern.startsWith("\n") ? absoluteIndex + 1 : absoluteIndex;
                const patternLength = pattern.startsWith("\n") ? pattern.length - 1 : pattern.length;
                return indexToLinePosition(adjustedIndex, patternLength, lines);
            }
        }
        // If full path not found, try to find a path that contains underscores (for underscore violations)
        if (message?.toLowerCase().includes("underscore")) {
            const underscorePathMatch = pathsSection.match(/\n\s+(\/[^:\s]*_[^:\s]*):/);
            if (underscorePathMatch) {
                const relativeIndex = pathsSection.indexOf(underscorePathMatch[0]);
                const absoluteIndex = pathsSectionStart + relativeIndex + 1; // +1 for newline
                return indexToLinePosition(absoluteIndex, underscorePathMatch[1].length + 1, lines);
            }
        }
        // Try to find the path that contains any segment
        const segments = path.split("/").filter(Boolean);
        for (const segment of segments) {
            // Skip path parameters like {petId}
            if (segment.startsWith("{"))
                continue;
            // Look for paths containing this segment
            const segmentPatterns = [
                new RegExp(`\\n\\s+"?/${segment}[/":]`, "g"),
                new RegExp(`\\n\\s+/${segment}[/":]`, "g"),
            ];
            for (const pattern of segmentPatterns) {
                const match = pattern.exec(pathsSection);
                if (match) {
                    const absoluteIndex = pathsSectionStart + match.index + 1; // +1 for newline
                    return indexToLinePosition(absoluteIndex, match[0].length - 1, lines);
                }
            }
        }
    }
    // Fallback: if message mentions underscore, find any path with underscores
    if (message?.toLowerCase().includes("underscore")) {
        const underscorePathMatch = pathsSection.match(/\n\s+(\/[^:\s]*_[^:\s]*):/);
        if (underscorePathMatch) {
            const relativeIndex = pathsSection.indexOf(underscorePathMatch[0]);
            const absoluteIndex = pathsSectionStart + relativeIndex + 1;
            return indexToLinePosition(absoluteIndex, underscorePathMatch[1].length + 1, lines);
        }
    }
    return null;
}
/**
 * Find line for a schema definition or property.
 */
function findSchemaLine(schemaPath, content, lines, message) {
    if (!schemaPath)
        return null;
    // Extract property name from message if present
    // Messages like: "Schema property 'petStatus' contains..."
    const propertyMatch = message?.match(/Schema property '([^']+)'/);
    const propertyName = propertyMatch?.[1];
    // Get the schema name (last part of path, or the path itself)
    const parts = schemaPath.replace(/^#\//, "").split("/");
    const schemaName = parts[parts.length - 1] || schemaPath;
    // Find the schema first
    const schemaPatterns = [
        `${schemaName}:`,
        `"${schemaName}":`,
    ];
    let schemaStart = -1;
    for (const pattern of schemaPatterns) {
        schemaStart = content.indexOf(pattern);
        if (schemaStart !== -1)
            break;
    }
    // If we have a property name and found the schema, search within the schema
    if (propertyName && schemaStart !== -1) {
        // Find the next schema (to limit search scope)
        const afterSchema = content.slice(schemaStart);
        const nextSchemaMatch = afterSchema.match(/\n {2}[A-Z][a-zA-Z0-9]*:/);
        const schemaEnd = nextSchemaMatch
            ? schemaStart + (nextSchemaMatch.index || afterSchema.length)
            : content.length;
        const schemaSection = content.slice(schemaStart, schemaEnd);
        // Now find the property within this schema
        const propPatterns = [
            `${propertyName}:`,
            `"${propertyName}":`,
        ];
        for (const pattern of propPatterns) {
            const propIndex = schemaSection.indexOf(pattern);
            if (propIndex !== -1) {
                return indexToLinePosition(schemaStart + propIndex, pattern.length, lines);
            }
        }
    }
    // Fall back to schema name
    if (schemaStart !== -1) {
        const pattern = schemaPatterns.find(p => content.indexOf(p) === schemaStart);
        return indexToLinePosition(schemaStart, pattern.length, lines);
    }
    return null;
}
/**
 * Find line for an HTTP status code.
 */
function findHttpCodeLine(httpCode, path, operationId, content, lines) {
    if (!httpCode)
        return null;
    // Search for status code
    const patterns = [
        `${httpCode}:`,
        `"${httpCode}":`,
        `'${httpCode}':`,
    ];
    for (const pattern of patterns) {
        const index = content.indexOf(pattern);
        if (index !== -1) {
            return indexToLinePosition(index, pattern.length, lines);
        }
    }
    // Fall back to operation or path
    return findOperationIdLine(operationId, path, content, lines);
}
/**
 * Find line for a tag definition.
 */
function findTagLine(tag, content, lines) {
    if (!tag)
        return null;
    const patterns = [
        `- ${tag}`,
        `- "${tag}"`,
        `name: ${tag}`,
        `name: "${tag}"`,
    ];
    for (const pattern of patterns) {
        const index = content.indexOf(pattern);
        if (index !== -1) {
            return indexToLinePosition(index, pattern.length, lines);
        }
    }
    return null;
}
/**
 * Find line for the info section.
 */
function findInfoLine(content, lines) {
    const index = content.indexOf("info:");
    if (index !== -1) {
        return indexToLinePosition(index, 5, lines);
    }
    return null;
}
// =============================================================================
// Helpers
// =============================================================================
/**
 * Convert a character index to a line position (1-indexed).
 */
function indexToLinePosition(index, length, lines) {
    let line = 0;
    let column = 0;
    let currentIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1; // +1 for newline
        if (currentIndex + lineLength > index) {
            line = i;
            column = index - currentIndex;
            break;
        }
        currentIndex += lineLength;
    }
    return {
        line: line + 1, // Convert to 1-indexed
        column,
        endColumn: column + length,
    };
}
//# sourceMappingURL=line-finder.js.map