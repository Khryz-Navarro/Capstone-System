<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Http\Request;

trait ResolvesActingResident
{
    protected function requireEffectiveResident(Request $request): User
    {
        $resident = $request->user()?->effectiveResident();

        abort_if($resident === null, 422, 'Select a resident account to continue.');

        return $resident;
    }
}
