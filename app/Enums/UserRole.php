<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case BarangayAdmin = 'barangay_admin';
    case BarangayStaff = 'barangay_staff';
    case Resident = 'resident';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::BarangayAdmin => 'Barangay Admin',
            self::BarangayStaff => 'Barangay Staff',
            self::Resident => 'Resident',
        };
    }

    public function isStaffLevel(): bool
    {
        return in_array($this, [self::BarangayAdmin, self::BarangayStaff], true);
    }

    /**
     * @param  list<string>  $roles
     */
    public function canAccess(string ...$roles): bool
    {
        if ($this === self::SuperAdmin) {
            return true;
        }

        return in_array($this->value, $roles, true);
    }
}
