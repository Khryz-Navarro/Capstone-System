<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('barangay_id')->nullable()->after('tenant_id')->constrained()->nullOnDelete();
            $table->string('username')->nullable()->unique()->after('name');
            $table->string('role')->default('resident')->after('username');
            $table->string('phone')->nullable()->after('email');
            $table->timestamp('last_login_at')->nullable()->after('role');

            $table->index(['tenant_id', 'barangay_id']);
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['barangay_id']);
            $table->dropColumn(['tenant_id', 'barangay_id', 'username', 'role', 'phone', 'last_login_at']);
        });
    }
};
