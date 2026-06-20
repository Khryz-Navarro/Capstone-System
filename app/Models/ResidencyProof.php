<?php

namespace App\Models;

use App\Enums\ProofType;
use App\Enums\VerificationStatus;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\ResidencyProofFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResidencyProof extends Model
{
    /** @use HasFactory<ResidencyProofFactory> */
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'barangay_id',
        'user_id',
        'type',
        'file_path',
        'original_name',
        'mime_type',
        'size',
        'status',
        'notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProofType::class,
            'status' => VerificationStatus::class,
            'reviewed_at' => 'datetime',
            'size' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
