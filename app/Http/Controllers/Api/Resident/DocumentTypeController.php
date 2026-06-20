<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentTypeResource;
use App\Models\DocumentType;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DocumentTypeController extends Controller
{
    /**
     * List the active document types available within the resident's barangay.
     */
    public function index(): AnonymousResourceCollection
    {
        $types = DocumentType::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return DocumentTypeResource::collection($types);
    }
}
