<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentTemplateRequest;
use App\Http\Requests\Admin\UpdateDocumentTemplateRequest;
use App\Http\Resources\DocumentTemplateResource;
use App\Models\DocumentTemplate;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class DocumentTemplateController extends Controller
{
    use ResolvesBarangay;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->requireBarangayId($request);

        $templates = DocumentTemplate::query()
            ->with('documentType')
            ->when($request->integer('document_type_id'), fn ($q, $id) => $q->where('document_type_id', $id))
            ->latest()
            ->get();

        return DocumentTemplateResource::collection($templates);
    }

    public function store(StoreDocumentTemplateRequest $request): JsonResponse
    {
        $data = $request->validated();

        $type = DocumentType::findOrFail($data['document_type_id']);
        $this->ensureSameBarangay($request, $type->barangay_id);

        $template = DB::transaction(function () use ($data) {
            $template = DocumentTemplate::create($data);
            $this->syncDefault($template);

            return $template;
        });

        return DocumentTemplateResource::make($template->load('documentType'))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateDocumentTemplateRequest $request, DocumentTemplate $documentTemplate): DocumentTemplateResource
    {
        $this->ensureSameBarangay($request, $documentTemplate->barangay_id);

        DB::transaction(function () use ($documentTemplate, $request) {
            $documentTemplate->update($request->validated());
            $this->syncDefault($documentTemplate);
        });

        return DocumentTemplateResource::make($documentTemplate->fresh()->load('documentType'));
    }

    public function destroy(Request $request, DocumentTemplate $documentTemplate): JsonResponse
    {
        $this->ensureSameBarangay($request, $documentTemplate->barangay_id);
        $documentTemplate->delete();

        return response()->json(['message' => 'Template removed.']);
    }

    /**
     * Ensure only one default template exists per document type.
     */
    protected function syncDefault(DocumentTemplate $template): void
    {
        if (! $template->is_default) {
            return;
        }

        DocumentTemplate::query()
            ->where('document_type_id', $template->document_type_id)
            ->where('id', '!=', $template->id)
            ->update(['is_default' => false]);
    }
}
