<?php

namespace App\Models;

use App\Enums\RequestStatus;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\DocumentRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentRequest extends Model
{
    /** @use HasFactory<DocumentRequestFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'barangay_id',
        'resident_id',
        'document_type_id',
        'reference_number',
        'certificate_number',
        'status',
        'purpose',
        'fee',
        'pdf_path',
        'processed_by',
        'remarks',
        'approved_at',
        'generated_at',
        'issued_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'status' => RequestStatus::class,
            'approved_at' => 'datetime',
            'generated_at' => 'datetime',
            'issued_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function resident(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resident_id');
    }

    /**
     * @return BelongsTo<DocumentType, $this>
     */
    public function documentType(): BelongsTo
    {
        return $this->belongsTo(DocumentType::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * @return HasMany<RequestStatusLog, $this>
     */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(RequestStatusLog::class);
    }

    /**
     * @return HasMany<RequestRequirement, $this>
     */
    public function requirements(): HasMany
    {
        return $this->hasMany(RequestRequirement::class);
    }
}
