<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->longText('body')->nullable();
            $table->boolean('is_default')->default(false);

            $table->timestamps();

            $table->index(['tenant_id', 'barangay_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
