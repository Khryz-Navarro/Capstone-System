<?php

namespace App\Http\Requests\Super;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:150'],
            'mobile_number' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'username' => ['nullable', 'string', 'max:50', 'alpha_dash', Rule::unique('users', 'username')],
            'role' => ['required', Rule::in([UserRole::BarangayStaff->value, UserRole::BarangayAdmin->value])],
            'password' => ['required', 'confirmed', Password::defaults()],
            'barangay_ids' => ['required', 'array', 'min:1'],
            'barangay_ids.*' => ['integer', 'distinct', 'exists:barangays,id'],
        ];
    }
}
