import axios from 'axios';

/**
 * Shared Axios instance for the Sanctum SPA. Cookies are sent with every
 * request and Laravel's XSRF token is forwarded automatically.
 */
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

let csrfInitialized = false;

/**
 * Fetch the CSRF cookie before performing a stateful (mutating) request.
 */
export async function ensureCsrf(): Promise<void> {
    if (csrfInitialized) return;
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
    csrfInitialized = true;
}

export default api;
