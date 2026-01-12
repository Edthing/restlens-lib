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
export function getApiUrl(override?: string): string {
  return override || process.env.RESTLENS_URL || process.env.RESTLENS_SERVER || DEFAULT_API_URL;
}

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

export const DEFAULT_CONFIG: Required<RestLensConfig> = {
  organization: "",
  project: "",
  apiUrl: DEFAULT_API_URL,
  evaluateOnSave: true,
  evaluateOnType: false,
  debounceMs: 1000,
  includeInfoSeverity: false,
};
