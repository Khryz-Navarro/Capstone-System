<?php

namespace App\Enums;

enum ProofType: string
{
    case GovernmentId = 'government_id';
    case VotersId = 'voters_id';
    case UtilityBill = 'utility_bill';
    case LeaseContract = 'lease_contract';
    case ResidencyCertificate = 'residency_certificate';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::GovernmentId => 'Government ID',
            self::VotersId => "Voter's ID",
            self::UtilityBill => 'Utility Bill',
            self::LeaseContract => 'Lease Contract',
            self::ResidencyCertificate => 'Existing Residency Certificate',
            self::Other => 'Other Supporting Document',
        };
    }
}
