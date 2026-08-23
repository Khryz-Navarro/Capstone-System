<?php

namespace App\Enums;

enum RequestStatus: string
{
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Generated = 'certificate_generated';
    case ReadyForPickup = 'ready_for_pickup';
    case Released = 'released';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::UnderReview => 'Under Review',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Generated => 'Certificate Generated',
            self::ReadyForPickup => 'Ready for Pickup',
            self::Released => 'Released',
            self::Cancelled => 'Cancelled',
        };
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Released, self::Rejected, self::Cancelled], true);
    }
}
