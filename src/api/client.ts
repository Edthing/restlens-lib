/**
 * REST Lens API Client
 *
 * Base client for communicating with the REST Lens API.
 */

import { RestLensAPIError } from "./error.js";
import type {
  SpecificationUploadResponse,
  ViolationsResponse,
  EvaluationStatus,
  ViolationKV,
} from "../types/index.js";

export interface RestLensClientOptions {
  baseUrl: string;
  accessToken: string;
  orgSlug?: string;
  projectSlug?: string;
  logger?: (msg: string) => void;
}

export class RestLensClient {
  private baseUrl: string;
  private accessToken: string;
  private orgSlug: string;
  private projectSlug: string;
  private log: (msg: string) => void;

  constructor(options: RestLensClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.orgSlug = options.orgSlug || "";
    this.projectSlug = options.projectSlug || "";
    this.log = options.logger || (() => {});
  }

  /**
   * Set the organization and project slugs.
   */
  setProject(orgSlug: string, projectSlug: string): void {
    this.orgSlug = orgSlug;
    this.projectSlug = projectSlug;
  }

  /**
   * Upload an OpenAPI specification.
   */
  async uploadSpec(
    spec: object,
    options?: { tag?: string; orgSlug?: string; projectSlug?: string }
  ): Promise<SpecificationUploadResponse> {
    const org = options?.orgSlug || this.orgSlug;
    const project = options?.projectSlug || this.projectSlug;

    if (!org || !project) {
      throw new RestLensAPIError(400, "Organization and project must be configured", "missing_config");
    }

    const url = `${this.baseUrl}/api/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/specifications`;

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ spec, tag: options?.tag }),
    });

    if (!response.ok) {
      throw await RestLensAPIError.fromResponse(response);
    }

    return response.json() as Promise<SpecificationUploadResponse>;
  }

  /**
   * Evaluate an OpenAPI specification.
   * Uploads the spec, waits for evaluation, and returns violations.
   */
  async evaluateSpec(
    spec: object,
    options?: { tag?: string; orgSlug?: string; projectSlug?: string }
  ): Promise<ViolationsResponse> {
    const uploadResult = await this.uploadSpec(spec, options);
    const specId = uploadResult.specification.id;

    return this.pollForResults(specId, options);
  }

  /**
   * Get violations for a specification.
   */
  async getViolations(
    specId: string,
    options?: { orgSlug?: string; projectSlug?: string }
  ): Promise<ViolationsResponse> {
    const org = options?.orgSlug || this.orgSlug;
    const project = options?.projectSlug || this.projectSlug;

    if (!org || !project) {
      throw new RestLensAPIError(400, "Organization and project must be configured", "missing_config");
    }

    const url = `${this.baseUrl}/api/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/specifications?specId=${specId}`;

    const response = await this.fetchWithRetry(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw await RestLensAPIError.fromResponse(response);
    }

    return response.json() as Promise<ViolationsResponse>;
  }

  /**
   * Poll for evaluation results.
   */
  async pollForResults(
    specId: string,
    options?: { orgSlug?: string; projectSlug?: string; maxAttempts?: number; intervalMs?: number }
  ): Promise<ViolationsResponse> {
    const maxAttempts = options?.maxAttempts ?? 30;
    const intervalMs = options?.intervalMs ?? 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getViolations(specId, options);

      // Check status from either location
      const status = result.evaluation?.status || result.status;

      if (status === "ready" || status === "partial" || status === "stale") {
        return result;
      }

      if (status === "error" || status === "failed") {
        throw new RestLensAPIError(
          500,
          result.evaluation?.message || result.error || "Evaluation failed",
          result.evaluation?.category
        );
      }

      // Wait before next poll
      if (attempt < maxAttempts - 1) {
        await this.sleep(intervalMs);
      }
    }

    throw new RestLensAPIError(408, "Evaluation timeout");
  }

  /**
   * Wait for an already-triggered evaluation to complete.
   * Differs from pollForResults in that it handles 404 (evaluation not ready yet).
   */
  async waitForEvaluation(
    specVersionId: string,
    options?: { maxAttempts?: number; intervalMs?: number }
  ): Promise<ViolationKV[]> {
    const maxAttempts = options?.maxAttempts ?? 60;
    const intervalMs = options?.intervalMs ?? 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/v1/specifications/${specVersionId}/violations`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Evaluation not ready yet
          await this.sleep(intervalMs);
          continue;
        }
        throw await RestLensAPIError.fromResponse(response);
      }

      const result = (await response.json()) as ViolationsResponse;

      // Check if evaluation is complete
      const status = result.status || result.evaluation?.status;
      if (status === "pending" || status === "in_progress" || status === "evaluating") {
        await this.sleep(intervalMs);
        continue;
      }

      if (status === "failed" || status === "error") {
        throw new RestLensAPIError(500, result.error || "Evaluation failed");
      }

      // Evaluation complete
      return result.violations || [];
    }

    throw new RestLensAPIError(408, "Evaluation timed out");
  }

  /**
   * Fetch with retry logic for transient errors.
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    this.log(`Fetching: ${url}`);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000),
        });

        this.log(`Response: ${response.status} ${response.statusText}`);

        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        if (response.ok) {
          return response;
        }

        // Retry server errors (5xx)
        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log(`Fetch error (attempt ${attempt + 1}): ${lastError.message}`);
        if (attempt < maxRetries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error("Request failed");
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Parse a project string in "org/project" format.
 */
export function parseProject(project: string): { orgSlug: string; projectName: string } {
  const [orgSlug, projectName] = project.split("/");
  if (!orgSlug || !projectName) {
    throw new Error("Project must be in org/name format (e.g., my-org/my-project)");
  }
  return { orgSlug, projectName };
}
