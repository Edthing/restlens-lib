/**
 * API Error Types
 *
 * Custom error class for REST Lens API errors.
 */
export interface APIError {
    error: string;
    code?: string;
}
export declare class RestLensAPIError extends Error {
    readonly status: number;
    readonly code?: string | undefined;
    constructor(status: number, message: string, code?: string | undefined);
    /**
     * Create an error from an HTTP response.
     */
    static fromResponse(response: Response): Promise<RestLensAPIError>;
}
//# sourceMappingURL=error.d.ts.map