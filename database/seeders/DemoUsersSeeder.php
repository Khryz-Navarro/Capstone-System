<?php

namespace Database\Seeders;

use App\Enums\CivilStatus;
use App\Enums\Gender;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Barangay;
use App\Models\ResidentProfile;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'superadmin@mtbdrs.test'],
            [
                'name' => 'System Super Admin',
                'username' => 'superadmin',
                'role' => UserRole::SuperAdmin,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $barangay = Barangay::where('name', 'Poblacion (Main Barangay)')->first();

        if ($barangay === null) {
            return;
        }

        $admin = User::firstOrCreate(
            ['email' => 'admin@poblacion.test'],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'name' => 'Poblacion Admin',
                'username' => 'poblacion_admin',
                'role' => UserRole::BarangayAdmin,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        StaffProfile::firstOrCreate(
            ['user_id' => $admin->id],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'first_name' => 'Poblacion',
                'last_name' => 'Admin',
                'position' => 'Barangay Administrator',
                'is_active' => true,
            ],
        );

        $admin->syncBarangayAssignments([$barangay->id]);

        $staff = User::firstOrCreate(
            ['email' => 'staff@poblacion.test'],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'name' => 'Poblacion Staff',
                'username' => 'poblacion_staff',
                'role' => UserRole::BarangayStaff,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        StaffProfile::firstOrCreate(
            ['user_id' => $staff->id],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'first_name' => 'Poblacion',
                'last_name' => 'Staff',
                'position' => 'Barangay Secretary',
                'is_active' => true,
            ],
        );

        $staff->syncBarangayAssignments([$barangay->id]);

        $resident = User::firstOrCreate(
            ['email' => 'resident@poblacion.test'],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'name' => 'Juan Dela Cruz',
                'username' => 'juandelacruz',
                'role' => UserRole::Resident,
                'phone' => '09171234567',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        ResidentProfile::firstOrCreate(
            ['user_id' => $resident->id],
            [
                'tenant_id' => $barangay->tenant_id,
                'barangay_id' => $barangay->id,
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
                'gender' => Gender::Male,
                'birthdate' => '1990-05-15',
                'civil_status' => CivilStatus::Married,
                'occupation' => 'Teacher',
                'mobile_number' => '09171234567',
                'house_number' => '123',
                'street' => 'Quezon Boulevard',
                'purok' => 'Purok 1',
                'sitio' => 'Centro',
                'city' => 'Kidapawan City',
                'province' => 'Cotabato',
                'verification_status' => VerificationStatus::Approved,
                'verified_at' => now(),
                'verified_by' => $staff->id,
            ],
        );
    }
}
