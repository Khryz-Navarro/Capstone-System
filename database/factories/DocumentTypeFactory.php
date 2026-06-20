<?php

namespace Database\Factories;

use App\Models\Barangay;
use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DocumentType>
 */
class DocumentTypeFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Barangay Clearance',
            'Certificate of Residency',
            'Certificate of Indigency',
            'Barangay Business Clearance',
            'First Time Job Seeker Certificate',
            'Solo Parent Certificate',
        ]);

        return [
            'barangay_id' => Barangay::factory(),
            'tenant_id' => fn (array $attributes) => Barangay::find($attributes['barangay_id'])?->tenant_id,
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'fee' => fake()->randomElement([0, 50, 75, 100]),
            'requires_purpose' => true,
            'is_active' => true,
        ];
    }
}
