<?php

namespace App\Http\Requests\Auth;

use App\Enums\CivilStatus;
use App\Enums\Gender;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'barangay_id' => ['required', 'integer', Rule::exists('barangays', 'id')->where('status', 'active')],

            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', Rule::enum(Gender::class)],
            'birthdate' => ['required', 'date', 'before:today'],
            'civil_status' => ['required', Rule::enum(CivilStatus::class)],
            'occupation' => ['nullable', 'string', 'max:100'],
            'mobile_number' => ['required', 'string', 'max:20'],
            'id_photo' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],

            'house_number' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:150'],
            'purok' => ['nullable', 'string', 'max:100'],
            'sitio' => ['nullable', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],

            'username' => ['nullable', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
