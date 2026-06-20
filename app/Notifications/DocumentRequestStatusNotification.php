<?php

namespace App\Notifications;

use App\Models\DocumentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentRequestStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public DocumentRequest $documentRequest,
        public ?string $remarks = null,
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
        $request = $this->documentRequest;

        $message = (new MailMessage)
            ->subject('Document Request Update: '.$request->reference_number)
            ->greeting('Hello!')
            ->line("Your request ({$request->reference_number}) status is now: {$request->status->label()}.");

        if ($this->remarks) {
            $message->line('Remarks: '.$this->remarks);
        }

        return $message->line('You may view your request in the portal.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $request = $this->documentRequest;

        return [
            'title' => 'Request '.$request->status->label(),
            'message' => "{$request->reference_number} is now {$request->status->label()}.",
            'request_id' => $request->id,
            'reference_number' => $request->reference_number,
            'status' => $request->status->value,
        ];
    }
}
