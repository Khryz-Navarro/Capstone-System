<?php

namespace App\Notifications;

use App\Enums\VerificationStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResidencyReviewedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public VerificationStatus $status,
        public ?string $reason = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $approved = $this->status === VerificationStatus::Approved;

        $message = (new MailMessage)
            ->subject($approved ? 'Residency Verified' : 'Residency Verification Update')
            ->greeting('Hello!')
            ->line($approved
                ? 'Your residency has been verified. You can now request barangay documents.'
                : 'Your residency verification was not approved.');

        if (! $approved && $this->reason) {
            $message->line('Reason: '.$this->reason);
        }

        return $message->line('Thank you for using '.config('app.name').'.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $approved = $this->status === VerificationStatus::Approved;

        return [
            'title' => $approved ? 'Residency approved' : 'Residency rejected',
            'message' => $approved
                ? 'You can now request barangay documents.'
                : ($this->reason ?? 'Please re-upload a valid residency proof.'),
            'status' => $this->status->value,
        ];
    }
}
