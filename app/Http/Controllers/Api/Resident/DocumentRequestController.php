<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Concerns\ResolvesActingResident;
use App\Http\Controllers\Concerns\StreamsPrivateFiles;
use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\StoreDocumentRequestRequest;
use App\Http\Resources\DocumentRequestResource;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Services\DocumentRequestService;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentRequestController extends Controller
{
    use ResolvesActingResident;
    use StreamsPrivateFiles;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', DocumentRequest::class);

        $resident = $this->requireEffectiveResident($request);

        $requests = DocumentRequest::query()
            ->where('resident_id', $resident->id)
            ->with(['documentType', 'requirements'])
            ->latest()
            ->paginate(15);

        return DocumentRequestResource::collection($requests);
    }

    public function store(StoreDocumentRequestRequest $request, DocumentRequestService $service, AuditLogger $audit): JsonResponse
    {
        $this->authorize('create', DocumentRequest::class);

        $resident = $this->requireEffectiveResident($request);
        $type = DocumentType::findOrFail($request->integer('document_type_id'));

        $supportingDocuments = $request->file('requirements', []);
        if (! is_array($supportingDocuments)) {
            $supportingDocuments = [$supportingDocuments];
        }

        $supportingDocuments = array_values(array_filter(
            $supportingDocuments,
            fn ($file): bool => $file instanceof UploadedFile,
        ));

        $documentRequest = $service->submit(
            $resident,
            $type,
            $request->input('purpose'),
            $request->file('id_photo'),
            $supportingDocuments,
        );

        $audit->log('document_request.submitted', $request->user(), 'Submitted a document request', [
            'request_id' => $documentRequest->id,
            'reference_number' => $documentRequest->reference_number,
            'resident_id' => $resident->id,
        ]);

        return DocumentRequestResource::make($documentRequest->load(['documentType', 'requirements']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(DocumentRequest $documentRequest): DocumentRequestResource
    {
        $this->authorize('view', $documentRequest);

        return DocumentRequestResource::make(
            $documentRequest->load([
                'documentType',
                'requirements',
                'statusLogs' => fn ($q) => $q->with('actor')->latest(),
            ])
        );
    }

    public function download(Request $request, DocumentRequest $documentRequest): StreamedResponse|BinaryFileResponse
    {
        $this->authorize('download', $documentRequest);

        return $this->streamPrivateFile(
            $documentRequest->pdf_path,
            $documentRequest->reference_number.'.pdf',
            $request->boolean('inline'),
        );
    }
}
