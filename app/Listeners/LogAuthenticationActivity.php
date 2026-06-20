<?php

namespace App\Listeners;

use App\Support\Audit\AuditLogger;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;

class LogAuthenticationActivity
{
    public function __construct(protected AuditLogger $audit) {}

    public function handleLogin(Login $event): void
    {
        $this->audit->log('auth.login', $event->user, 'User logged in.');
    }

    public function handleLogout(Logout $event): void
    {
        if ($event->user !== null) {
            $this->audit->log('auth.logout', $event->user, 'User logged out.');
        }
    }

    public function handleRegistered(Registered $event): void
    {
        $this->audit->log('auth.registered', $event->user, 'New account registered.');
    }

    public function handleVerified(Verified $event): void
    {
        $this->audit->log('auth.email_verified', $event->user, 'Email address verified.');
    }
}
