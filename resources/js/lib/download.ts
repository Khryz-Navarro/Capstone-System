import { AxiosError } from 'axios';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;

            if (typeof result !== 'string') {
                reject(new Error('Unable to read file data.'));

                return;
            }

            const base64 = result.split(',')[1];

            if (! base64) {
                reject(new Error('Unable to encode file data.'));

                return;
            }

            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Unable to read file data.'));
        reader.readAsDataURL(blob);
    });
}

async function shareNativeFile(blob: Blob, filename: string): Promise<void> {
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
    });

    await Share.share({
        title: filename,
        url: saved.uri,
    });
}

async function openNativeFile(blob: Blob, filename: string): Promise<void> {
    const base64 = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
    });

    await Browser.open({ url: saved.uri });
}

export async function downloadAuthenticatedFile(url: string, suggestedFilename?: string): Promise<void> {
    try {
        const { blob, filename } = await fetchAuthenticatedBlob(url);
        const resolvedFilename = filename ?? suggestedFilename ?? 'download';

        if (Capacitor.isNativePlatform()) {
            await shareNativeFile(blob, resolvedFilename);

            return;
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = resolvedFilename;
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
        const { blob, filename } = await fetchAuthenticatedBlob(url);
        const resolvedFilename = filename ?? 'preview.pdf';

        if (Capacitor.isNativePlatform()) {
            await openNativeFile(blob, resolvedFilename);

            return;
        }

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
