<?php

namespace App\Http\Controllers\Api\Staff;

use App\Enums\RequestStatus;
use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Concerns\StreamsPrivateFiles;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentRequestResource;
use App\Models\DocumentRequest;
use App\Notifications\DocumentRequestStatusNotification;
use App\Services\CertificateGenerator;
use App\Services\DocumentRequestService;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StaffDocumentRequestController extends Controller
{
    use ResolvesBarangay;
    use StreamsPrivateFiles;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->requireBarangayId($request);
        $status = $request->string('status')->value();
        $search = $request->string('search')->value();

        $requests = DocumentRequest::query()
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->when($search !== '', fn ($q) => $q->where('reference_number', 'like', "%{$search}%"))
            ->with(['documentType', 'resident.residentProfile'])
            ->latest()
            ->paginate(15);

        return DocumentRequestResource::collection($requests);
    }

    public function show(Request $request, DocumentRequest $documentRequest): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);

        return DocumentRequestResource::make(
            $documentRequest->load([
                'documentType',
                'resident.residentProfile',
                'statusLogs' => fn ($q) => $q->with('actor')->latest(),
            ])
        );
    }

    public function approve(Request $request, DocumentRequest $documentRequest, DocumentRequestService $service, AuditLogger $audit): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        $remarks = $request->string('remarks')->value() ?: null;

        $service->transition($documentRequest, RequestStatus::Approved, $request->user(), $remarks);
        $this->notifyResident($documentRequest, $remarks);
        $audit->log('document_request.approved', $request->user(), 'Approved document request', ['request_id' => $documentRequest->id]);

        return DocumentRequestResource::make($documentRequest->load('documentType'));
    }

    public function reject(Request $request, DocumentRequest $documentRequest, DocumentRequestService $service, AuditLogger $audit): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        $validated = $request->validate(['remarks' => ['required', 'string', 'max:500']]);

        $service->transition($documentRequest, RequestStatus::Rejected, $request->user(), $validated['remarks']);
        $this->notifyResident($documentRequest, $validated['remarks']);
        $audit->log('document_request.rejected', $request->user(), 'Rejected document request', ['request_id' => $documentRequest->id]);

        return DocumentRequestResource::make($documentRequest->load('documentType'));
    }

    public function generate(Request $request, DocumentRequest $documentRequest, CertificateGenerator $generator, AuditLogger $audit): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        $generator->generate($documentRequest, $request->user());
        $this->notifyResident($documentRequest->refresh());
        $audit->log('document_request.generated', $request->user(), 'Generated certificate', [
            'request_id' => $documentRequest->id,
            'certificate_number' => $documentRequest->certificate_number,
        ]);

        return DocumentRequestResource::make($documentRequest->load('documentType'));
    }

    public function markReady(Request $request, DocumentRequest $documentRequest, DocumentRequestService $service): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        $service->transition($documentRequest, RequestStatus::ReadyForPickup, $request->user(), 'Ready for pickup at the barangay hall.');
        $this->notifyResident($documentRequest);

        return DocumentRequestResource::make($documentRequest->load('documentType'));
    }

    public function release(Request $request, DocumentRequest $documentRequest, DocumentRequestService $service, AuditLogger $audit): DocumentRequestResource
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        $remarks = $request->string('remarks')->value() ?: 'Document released to resident.';

        $service->transition($documentRequest, RequestStatus::Released, $request->user(), $remarks);
        $this->notifyResident($documentRequest);
        $audit->log('document_request.released', $request->user(), 'Released document', ['request_id' => $documentRequest->id]);

        return DocumentRequestResource::make($documentRequest->load('documentType'));
    }

    public function download(Request $request, DocumentRequest $documentRequest): StreamedResponse|BinaryFileResponse
    {
        $this->ensureSameBarangay($request, $documentRequest->barangay_id);
        abort_if($documentRequest->pdf_path === null, 404, 'No certificate generated yet.');

        return $this->streamPrivateFile(
            $documentRequest->pdf_path,
            $documentRequest->reference_number.'.pdf',
            $request->boolean('inline'),
        );
    }

    protected function notifyResident(DocumentRequest $documentRequest, ?string $remarks = null): void
    {
        $documentRequest->resident?->notify(new DocumentRequestStatusNotification($documentRequest, $remarks));
    }
}
