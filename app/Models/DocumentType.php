<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\DocumentTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentType extends Model
{
    /** @use HasFactory<DocumentTypeFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'barangay_id',
        'name',
        'slug',
        'description',
        'fee',
        'requires_purpose',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'requires_purpose' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<DocumentTemplate, $this>
     */
    public function templates(): HasMany
    {
        return $this->hasMany(DocumentTemplate::class);
    }

    /**
     * @return HasMany<DocumentRequest, $this>
     */
    public function requests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class);
    }
}
