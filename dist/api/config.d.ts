/**
 * Configuration Defaults
 *
 * Common configuration values used across REST Lens clients.
 */
export declare const DEFAULT_API_URL = "https://restlens.com";
export declare const STAGING_API_URL = "https://staging.restlens.com";
/** OAuth client ID for VS Code extension */
export declare const OAUTH_CLIENT_ID_VSCODE = "vscode_restlens";
/** OAuth client ID for CLI */
export declare const OAUTH_CLIENT_ID_CLI = "cli_restlens";
/** OAuth scopes - typically needed for full access */
export declare const OAUTH_SCOPES: string[];
/**
 * Get the API URL from environment or default.
 */
export declare function getApiUrl(override?: string): string;
/**
 * Workspace configuration file (.restlens.json) format.
 */
export interface RestLensConfig {
    /** Organization slug */
    organization?: string;
    /** Project slug */
    project?: string;
    /** REST Lens API URL (default: https://restlens.com) */
    apiUrl?: string;
    /** Evaluate on file save (default: true) */
    evaluateOnSave?: boolean;
    /** Evaluate on file change with debounce (default: false) */
    evaluateOnType?: boolean;
    /** Debounce delay in milliseconds (default: 1000) */
    debounceMs?: number;
    /** Include info-level violations (default: false) */
    includeInfoSeverity?: boolean;
}
export declare const DEFAULT_CONFIG: Required<RestLensConfig>;
//# sourceMappingURL=config.d.ts.map