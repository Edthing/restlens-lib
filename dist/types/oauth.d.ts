/**
 * OAuth Types
 *
 * Types for OAuth authentication flows.
 */
export interface OAuthTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: "Bearer";
    expires_in: number;
    scope?: string;
    project_ids?: string[];
}
export interface OAuthErrorResponse {
    error: string;
    error_description?: string;
}
export interface ServerAuth {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}
export interface AuthConfig {
    servers: Record<string, ServerAuth>;
}
//# sourceMappingURL=oauth.d.ts.map