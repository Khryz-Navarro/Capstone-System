<?php

namespace Database\Seeders;

use App\Enums\BarangayStatus;
use App\Enums\TenantStatus;
use App\Models\Barangay;
use App\Models\DocumentType;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BarangaySeeder extends Seeder
{
    /**
     * The barangays of Kidapawan City. Each barangay is its own tenant so that
     * tenant_id provides hard data isolation between barangays.
     *
     * @var list<string>
     */
    protected array $barangays = [
        'Amas', 'Amazion', 'Balabag', 'Balindog', 'Binoligan', 'Birada',
        'Gayola', 'Ginatilan', 'Ilomavis', 'Indangan', 'Junction', 'Kalaisan',
        'Kalasuyan', 'Katipunan', 'Lanao', 'Linangcob', 'Luvimin', 'Macabolig',
        'Magsaysay', 'Malinan', 'Manongol', 'Marbel (Embac)', 'Mateo', 'Meochao',
        'Mua-an', 'New Bohol', 'Nuangan', 'Onica', 'Paco', 'Patadon (Patadon East)',
        'Perez', 'Poblacion (Main Barangay)', 'San Isidro', 'San Roque', 'Santo Niño',
        'Sibawan', 'Sikitan', 'Singao', 'Sudapin', 'Sumbac',
    ];

    /**
     * Default document types provisioned for every barangay.
     *
     * @var list<array{name: string, fee: float, requires_purpose: bool, description: string}>
     */
    protected array $documentTypes = [
        ['name' => 'Barangay Clearance', 'fee' => 50, 'requires_purpose' => true, 'description' => 'General clearance certifying good standing in the barangay.'],
        ['name' => 'Certificate of Residency', 'fee' => 0, 'requires_purpose' => true, 'description' => 'Certifies that the requester is a bona fide resident.'],
        ['name' => 'Certificate of Indigency', 'fee' => 0, 'requires_purpose' => true, 'description' => 'Certifies indigent status for assistance and waivers.'],
        ['name' => 'Barangay Business Clearance', 'fee' => 100, 'requires_purpose' => true, 'description' => 'Clearance for operating a business within the barangay.'],
        ['name' => 'First Time Job Seeker Certificate', 'fee' => 0, 'requires_purpose' => false, 'description' => 'Certificate for first time job seekers under RA 11261.'],
        ['name' => 'Solo Parent Certificate', 'fee' => 0, 'requires_purpose' => true, 'description' => 'Certifies solo parent status under the Solo Parents Welfare Act.'],
    ];

    public function run(): void
    {
        foreach ($this->barangays as $index => $name) {
            $code = 'BRGY-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);

            $tenant = Tenant::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'status' => TenantStatus::Active],
            );

            $barangay = Barangay::firstOrCreate(
                ['code' => $code],
                [
                    'tenant_id' => $tenant->id,
                    'name' => $name,
                    'region' => 'Region XII (SOCCSKSARGEN)',
                    'province' => 'Cotabato',
                    'city' => 'Kidapawan City',
                    'contact_number' => '0900'.str_pad((string) ($index + 1), 7, '0', STR_PAD_LEFT),
                    'official_email' => Str::slug($name).'@kidapawan.gov.ph',
                    'captain' => 'Hon. Barangay Captain',
                    'status' => BarangayStatus::Active,
                ],
            );

            foreach ($this->documentTypes as $type) {
                DocumentType::firstOrCreate(
                    ['barangay_id' => $barangay->id, 'slug' => Str::slug($type['name'])],
                    [
                        'tenant_id' => $tenant->id,
                        'name' => $type['name'],
                        'description' => $type['description'],
                        'fee' => $type['fee'],
                        'requires_purpose' => $type['requires_purpose'],
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
