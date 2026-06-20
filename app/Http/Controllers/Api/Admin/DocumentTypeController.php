<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Concerns\ResolvesBarangay;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDocumentTypeRequest;
use App\Http\Requests\Admin\UpdateDocumentTypeRequest;
use App\Http\Resources\DocumentTypeResource;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class DocumentTypeController extends Controller
{
    use ResolvesBarangay;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->requireBarangayId($request);

        return DocumentTypeResource::collection(
            DocumentType::query()->withCount('requests')->orderBy('name')->get()
        );
    }

    public function store(StoreDocumentTypeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($this->requireBarangayId($request), $data['name']);

        $type = DocumentType::create($data);

        return DocumentTypeResource::make($type)->response()->setStatusCode(201);
    }

    public function update(UpdateDocumentTypeRequest $request, DocumentType $documentType): DocumentTypeResource
    {
        $this->ensureSameBarangay($request, $documentType->barangay_id);
        $data = $request->validated();

        if ($data['name'] !== $documentType->name) {
            $data['slug'] = $this->uniqueSlug($documentType->barangay_id, $data['name'], $documentType->id);
        }

        $documentType->update($data);

        return DocumentTypeResource::make($documentType);
    }

    public function destroy(Request $request, DocumentType $documentType): JsonResponse
    {
        $this->ensureSameBarangay($request, $documentType->barangay_id);
        abort_if($documentType->requests()->exists(), 422, 'Cannot delete a document type that has requests.');

        $documentType->templates()->delete();
        $documentType->delete();

        return response()->json(['message' => 'Document type removed.']);
    }

    protected function uniqueSlug(int $barangayId, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            DocumentType::query()
                ->where('barangay_id', $barangayId)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
