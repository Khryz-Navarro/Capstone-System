<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barangay_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'barangay_id']);
            $table->index(['barangay_id', 'user_id']);
        });

        User::query()
            ->whereIn('role', [UserRole::BarangayAdmin, UserRole::BarangayStaff])
            ->whereNotNull('barangay_id')
            ->each(function (User $user): void {
                DB::table('barangay_user')->insertOrIgnore([
                    'user_id' => $user->id,
                    'barangay_id' => $user->barangay_id,
                    'tenant_id' => $user->tenant_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('barangay_user');
    }
};
