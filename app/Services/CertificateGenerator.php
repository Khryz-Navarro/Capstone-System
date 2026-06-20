<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\DocumentRequest;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateGenerator
{
    public function __construct(protected DocumentRequestService $requests) {}

    /**
     * Generate the certificate PDF (with QR verification code) for a request,
     * store it, and move the request into the "generated" state.
     */
    public function generate(DocumentRequest $request, ?User $actor = null): DocumentRequest
    {
        $request->loadMissing(['documentType', 'resident.residentProfile', 'barangay']);

        $certificateNumber = $request->certificate_number ?? $this->generateCertificateNumber($request);

        $verifyUrl = rtrim((string) config('app.url'), '/').'/verify/'.$request->reference_number;
        $qrSvg = base64_encode(QrCode::format('svg')->size(140)->margin(0)->generate($verifyUrl));

        $pdf = Pdf::loadView('certificates.default', [
            'request' => $request,
            'barangay' => $request->barangay,
            'profile' => $request->resident->residentProfile,
            'documentType' => $request->documentType,
            'certificateNumber' => $certificateNumber,
            'qr' => 'data:image/svg+xml;base64,'.$qrSvg,
            'verifyUrl' => $verifyUrl,
            'issuedAt' => now(),
        ])->setPaper('a4');

        $path = "certificates/{$request->barangay_id}/{$request->reference_number}.pdf";
        Storage::disk('local')->put($path, $pdf->output());

        $request->forceFill([
            'certificate_number' => $certificateNumber,
            'pdf_path' => $path,
        ])->save();

        return $this->requests->transition($request, RequestStatus::Generated, $actor, 'Certificate generated.');
    }

    protected function generateCertificateNumber(DocumentRequest $request): string
    {
        $barangayCode = $request->barangay?->code ?? 'BRGY';

        do {
            $number = sprintf('CERT-%s-%s-%s', now()->format('Y'), $barangayCode, strtoupper(Str::random(5)));
        } while (DocumentRequest::withoutGlobalScopes()->where('certificate_number', $number)->exists());

        return $number;
    }
}
