<?php

namespace App\Http\Requests\Resident;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequestRequest extends FormRequest
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
        $barangayId = $this->user()->effectiveBarangayId();

        return [
            'document_type_id' => [
                'required',
                'integer',
                Rule::exists('document_types', 'id')
                    ->where('barangay_id', $barangayId)
                    ->where('is_active', true),
            ],
            'purpose' => ['nullable', 'string', 'max:500'],
            'id_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'requirements' => ['nullable', 'array', 'max:5'],
            'requirements.*' => ['file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'notification_channels' => ['nullable', 'array'],
            'notification_channels.*' => ['string', Rule::in(['email', 'sms'])],
        ];
    }
}
