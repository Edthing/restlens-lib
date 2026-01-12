/**
 * Configuration Defaults
 *
 * Common configuration values used across REST Lens clients.
 */
export const DEFAULT_API_URL = "https://restlens.com";
export const STAGING_API_URL = "https://staging.restlens.com";
/** OAuth client ID for VS Code extension */
export const OAUTH_CLIENT_ID_VSCODE = "vscode_restlens";
/** OAuth client ID for CLI */
export const OAUTH_CLIENT_ID_CLI = "cli_restlens";
/** OAuth scopes - typically needed for full access */
export const OAUTH_SCOPES = ["projects:read", "specs:write", "evaluations:read"];
/**
 * Get the API URL from environment or default.
 */
export function getApiUrl(override) {
    return override || process.env.RESTLENS_URL || process.env.RESTLENS_SERVER || DEFAULT_API_URL;
}
export const DEFAULT_CONFIG = {
    organization: "",
    project: "",
    apiUrl: DEFAULT_API_URL,
    evaluateOnSave: true,
    evaluateOnType: false,
    debounceMs: 1000,
    includeInfoSeverity: false,
};
//# sourceMappingURL=config.js.map