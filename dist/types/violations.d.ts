/**
 * Violation Types
 *
 * Types for REST Lens violation data structures.
 */
export declare enum ViolationKeyType {
    OPERATION_ID = "operation_id",
    PATH = "path",
    SCHEMA_PATH = "schema_path",
    HTTP_CODE = "http_code",
    TAG = "tag",
    INFO = "info",
    SYSTEM = "system"
}
export interface ViolationKey {
    violation_key_type: ViolationKeyType;
    operation_id?: string;
    path?: string;
    schema_path?: string;
    http_code?: string;
    tag?: string;
}
export type Severity = "info" | "warning" | "error";
export interface Violation {
    rule_id: number;
    message: string;
    severity?: Severity;
    rule_slug?: string;
}
export interface ViolationKV {
    key: ViolationKey;
    value: Violation[];
}
export interface FlatViolation {
    key: ViolationKey;
    line: number;
    column: number;
    ruleId: string;
    ruleName: string;
    message: string;
    severity: Severity;
}
export interface LinePosition {
    line: number;
    column: number;
    endColumn: number;
}
//# sourceMappingURL=violations.d.ts.map