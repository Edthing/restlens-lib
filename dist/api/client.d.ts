/**
 * REST Lens API Client
 *
 * Base client for communicating with the REST Lens API.
 */
import type { SpecificationUploadResponse, ViolationsResponse, ViolationKV } from "../types/index.js";
export interface RestLensClientOptions {
    baseUrl: string;
    accessToken: string;
    orgSlug?: string;
    projectSlug?: string;
    logger?: (msg: string) => void;
}
export declare class RestLensClient {
    private baseUrl;
    private accessToken;
    private orgSlug;
    private projectSlug;
    private log;
    constructor(options: RestLensClientOptions);
    /**
     * Set the organization and project slugs.
     */
    setProject(orgSlug: string, projectSlug: string): void;
    /**
     * Upload an OpenAPI specification.
     */
    uploadSpec(spec: object, options?: {
        tag?: string;
        orgSlug?: string;
        projectSlug?: string;
    }): Promise<SpecificationUploadResponse>;
    /**
     * Evaluate an OpenAPI specification.
     * Uploads the spec, waits for evaluation, and returns violations.
     */
    evaluateSpec(spec: object, options?: {
        tag?: string;
        orgSlug?: string;
        projectSlug?: string;
    }): Promise<ViolationsResponse>;
    /**
     * Get violations for a specification.
     */
    getViolations(specId: string, options?: {
        orgSlug?: string;
        projectSlug?: string;
    }): Promise<ViolationsResponse>;
    /**
     * Poll for evaluation results.
     */
    pollForResults(specId: string, options?: {
        orgSlug?: string;
        projectSlug?: string;
        maxAttempts?: number;
        intervalMs?: number;
    }): Promise<ViolationsResponse>;
    /**
     * Wait for an already-triggered evaluation to complete.
     * Differs from pollForResults in that it handles 404 (evaluation not ready yet).
     */
    waitForEvaluation(specVersionId: string, options?: {
        maxAttempts?: number;
        intervalMs?: number;
    }): Promise<ViolationKV[]>;
    /**
     * Fetch with retry logic for transient errors.
     */
    protected fetchWithRetry(url: string, options: RequestInit, maxRetries?: number): Promise<Response>;
    protected sleep(ms: number): Promise<void>;
}
/**
 * Parse a project string in "org/project" format.
 */
export declare function parseProject(project: string): {
    orgSlug: string;
    projectName: string;
};
//# sourceMappingURL=client.d.ts.map