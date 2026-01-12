/**
 * API Response Types
 *
 * Types for REST Lens API responses.
 */

import type { ViolationKV, Severity } from "./violations.js";

export type EvaluationStatus =
  | "ready"
  | "evaluating"
  | "error"
  | "partial"
  | "stale"
  | "pending"
  | "in_progress"
  | "failed";

export interface SpecificationUploadResponse {
  specification: {
    id: string;
    projectId: string;
    tag?: string;
    version?: number;
    createdAt: string;
    updatedAt: string;
  };
  evaluation?: {
    status: string;
  };
}

export interface ViolationsResponse {
  evaluation?: {
    status: EvaluationStatus;
    specId: string;
    message?: string;
    category?: string;
    staleRulesCount?: number;
  };
  status?: EvaluationStatus;
  violations?: ViolationKV[];
  tree?: PathNode;
  ruleIdToSlug?: Record<number, string>;
  billingWarning?: string;
  error?: string;
  totalViolations?: number;
}

export interface SpecificationsListResponse {
  specifications: Array<{
    id: string;
    tag?: string;
    version?: number;
    createdAt: string;
    evaluationStatus?: EvaluationStatus;
  }>;
  evaluation?: {
    status: EvaluationStatus;
    specId: string;
    message?: string;
  };
  violations?: ViolationKV[];
  tree?: PathNode;
}

export enum HTTPMethod {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
  OPTIONS = "options",
  HEAD = "head",
}

export interface PathNode {
  key: string;
  children: Record<string, PathNode>;
  methods: Record<HTTPMethod, unknown>;
}

export interface RuleMetadata {
  rule_id: number;
  name: string;
  description: string;
  hidden: boolean;
}

export interface RulesConfig {
  config: Record<number, Record<string, string>>;
  enabled: Record<number, boolean>;
  ignore: Record<number, ViolationKV["key"][]>;
  ignore_all: ViolationKV["key"][];
}

export interface ViolationSummary {
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
}
