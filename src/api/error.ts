/**
 * API Error Types
 *
 * Custom error class for REST Lens API errors.
 */

export interface APIError {
  error: string;
  code?: string;
}

export class RestLensAPIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "RestLensAPIError";
  }

  /**
   * Create an error from an HTTP response.
   */
  static async fromResponse(response: Response): Promise<RestLensAPIError> {
    let message = "API request failed";
    let code: string | undefined;

    try {
      const body = (await response.json()) as { error?: string; code?: string };
      message = body.error || message;
      code = body.code;
    } catch {
      // Use default message if body can't be parsed
    }

    // Map common status codes to user-friendly messages
    switch (response.status) {
      case 401:
        return new RestLensAPIError(401, "Invalid or expired token. Please sign in again.", code);
      case 402:
        return new RestLensAPIError(402, message || "Insufficient credits", "billing_error");
      case 403:
        return new RestLensAPIError(403, "Not authorized to access this project", code);
      case 404:
        return new RestLensAPIError(404, "Project not found", code);
      case 413:
        return new RestLensAPIError(413, "Specification too large (max 10MB)", code);
      case 429:
        return new RestLensAPIError(429, "Rate limit exceeded. Please wait before retrying.", code);
      default:
        return new RestLensAPIError(response.status, message, code);
    }
  }
}
