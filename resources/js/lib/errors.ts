import { AxiosError } from 'axios';

interface LaravelValidationResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

/**
 * Extract a human-friendly message from an Axios/Laravel error response.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data as LaravelValidationResponse | undefined;
        if (data?.errors) {
            const first = Object.values(data.errors)[0];
            if (first && first.length > 0) return first[0];
        }
        if (data?.message) return data.message;
    }
    return fallback;
}

/**
 * Extract field-level validation errors keyed by field name.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    if (error instanceof AxiosError) {
        const data = error.response?.data as LaravelValidationResponse | undefined;
        if (data?.errors) {
            for (const [field, messages] of Object.entries(data.errors)) {
                if (messages.length > 0) result[field] = messages[0];
            }
        }
    }
    return result;
}
