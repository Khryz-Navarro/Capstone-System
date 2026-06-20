import { AxiosError } from 'axios';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/errors';

function filenameFromDisposition(header?: string): string | null {
    if (!header) {
        return null;
    }

    const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const match = /filename="?([^";]+)"?/i.exec(header);

    return match?.[1] ?? null;
}

async function messageFromAxiosBlobError(error: AxiosError<Blob>): Promise<string | null> {
    const contentType = error.response?.headers['content-type'] ?? '';

    if (!(error.response?.data instanceof Blob) || !contentType.includes('application/json')) {
        return null;
    }

    try {
        const payload = JSON.parse(await error.response.data.text()) as { message?: string };

        return payload.message ?? null;
    } catch {
        return null;
    }
}

async function resolveDownloadError(error: unknown, fallback: string): Promise<string> {
    if (error instanceof Error && !(error instanceof AxiosError)) {
        return error.message;
    }

    if (error instanceof AxiosError) {
        const blobMessage = await messageFromAxiosBlobError(error);

        if (blobMessage) {
            return blobMessage;
        }
    }

    return getApiErrorMessage(error, fallback);
}

async function fetchAuthenticatedBlob(url: string): Promise<{ blob: Blob; filename: string | null }> {
    const response = await api.get<Blob>(url, {
        responseType: 'blob',
        headers: {
            Accept: '*/*',
        },
    });

    const contentType = response.headers['content-type'] ?? '';

    if (contentType.includes('application/json')) {
        const text = await response.data.text();
        let message = 'Unable to download file.';

        try {
            const payload = JSON.parse(text) as { message?: string };
            if (payload.message) {
                message = payload.message;
            }
        } catch {
            // Keep default message when the body is not JSON.
        }

        throw new Error(message);
    }

    return {
        blob: response.data,
        filename: filenameFromDisposition(response.headers['content-disposition']),
    };
}

export async function downloadAuthenticatedFile(url: string, suggestedFilename?: string): Promise<void> {
    try {
        const { blob, filename } = await fetchAuthenticatedBlob(url);
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename ?? suggestedFilename ?? 'download';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
    } catch (error) {
        throw new Error(await resolveDownloadError(error, 'Unable to download file.'));
    }
}

export async function openAuthenticatedFile(url: string): Promise<void> {
    try {
        const { blob } = await fetchAuthenticatedBlob(url);
        const objectUrl = URL.createObjectURL(blob);
        const tab = window.open(objectUrl, '_blank', 'noopener,noreferrer');

        if (!tab) {
            URL.revokeObjectURL(objectUrl);
            throw new Error('Pop-up blocked. Allow pop-ups to preview this file.');
        }

        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
        throw new Error(await resolveDownloadError(error, 'Unable to open file.'));
    }
}
