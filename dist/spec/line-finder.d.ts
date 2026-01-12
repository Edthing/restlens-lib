/**
 * Line Finder
 *
 * Finds the line number for a violation in an OpenAPI specification.
 * Used for mapping violations to source locations in editors and CI output.
 */
import type { ViolationKey, ViolationKV, LinePosition, FlatViolation, Severity } from "../types/index.js";
/**
 * Find the line position for a violation in the spec content.
 */
export declare function findViolationLine(key: ViolationKey, content: string, message?: string): LinePosition;
/**
 * Convert a list of ViolationKV to flat violations with line numbers.
 */
export declare function flattenViolationsWithLines(violations: ViolationKV[], content: string): FlatViolation[];
/**
 * Build a summary of violations.
 */
export declare function buildViolationSummary(violations: FlatViolation[]): {
    totalViolations: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    byRule: Array<{
        ruleId: string;
        ruleName: string;
        severity: Severity;
        count: number;
    }>;
};
//# sourceMappingURL=line-finder.d.ts.map