<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->decimal('fee', 8, 2)->default(0);
            $table->boolean('requires_purpose')->default(true);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['barangay_id', 'slug']);
            $table->index(['tenant_id', 'barangay_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
