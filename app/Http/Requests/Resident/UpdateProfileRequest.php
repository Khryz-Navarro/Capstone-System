<?php

namespace App\Http\Requests\Resident;

use App\Enums\CivilStatus;
use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', Rule::enum(Gender::class)],
            'birthdate' => ['required', 'date', 'before:today'],
            'civil_status' => ['required', Rule::enum(CivilStatus::class)],
            'occupation' => ['nullable', 'string', 'max:100'],
            'mobile_number' => ['required', 'string', 'max:20'],

            'house_number' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:150'],
            'purok' => ['nullable', 'string', 'max:100'],
            'sitio' => ['nullable', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],

            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
