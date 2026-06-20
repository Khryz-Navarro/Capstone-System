<?php

namespace App\Enums;

enum BarangayStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}
