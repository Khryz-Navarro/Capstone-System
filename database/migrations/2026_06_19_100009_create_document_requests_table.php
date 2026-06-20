<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->foreignId('resident_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('document_type_id')->constrained()->cascadeOnDelete();

            $table->string('reference_number')->unique();
            $table->string('certificate_number')->nullable()->unique();
            $table->string('status')->default('submitted');
            $table->text('purpose')->nullable();
            $table->decimal('fee', 8, 2)->default(0);

            $table->string('pdf_path')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('released_at')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'barangay_id']);
            $table->index('resident_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_requests');
    }
};
