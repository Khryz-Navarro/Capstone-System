<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

trait StreamsPrivateFiles
{
    protected function streamPrivateFile(string $path, string $filename, bool $inline = false): StreamedResponse|BinaryFileResponse
    {
        abort_unless(Storage::disk('local')->exists($path), 404, 'File not found.');

        if ($inline) {
            return response()->file(
                Storage::disk('local')->path($path),
                [
                    'Content-Type' => Storage::disk('local')->mimeType($path) ?: 'application/octet-stream',
                    'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
                ],
            );
        }

        return Storage::disk('local')->download($path, $filename);
    }
}
