<?php

namespace Database\Factories;

use App\Models\DocumentTemplate;
use App\Models\DocumentType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentTemplate>
 */
class DocumentTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'document_type_id' => DocumentType::factory(),
            'tenant_id' => fn (array $attributes) => DocumentType::find($attributes['document_type_id'])?->tenant_id,
            'barangay_id' => fn (array $attributes) => DocumentType::find($attributes['document_type_id'])?->barangay_id,
            'name' => fake()->words(3, true),
            'body' => '<p>This is to certify that {{resident_name}} is a resident of {{barangay_name}}.</p>',
            'is_default' => true,
        ];
    }
}
