<?php

namespace App\Http\Requests\Resident;

use App\Enums\ProofType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResidencyProofRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($user->isResident()) {
            return true;
        }

        return $user->isSuperAdmin()
            && $user->effectiveBarangayId() !== null
            && $user->actingResidentId() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ProofType::class)],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ];
    }
}
