<?php

namespace App\Http\Controllers\Api\Resident;

use App\Http\Controllers\Concerns\ResolvesActingResident;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ResolvesActingResident;

    public function index(Request $request): JsonResponse
    {
        $resident = $this->requireEffectiveResident($request);

        $notifications = $resident->notifications()->latest()->limit(50)->get();

        return response()->json([
            'data' => NotificationResource::collection($notifications),
            'unread_count' => $resident->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $resident = $this->requireEffectiveResident($request);
        $notification = $resident->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $resident = $this->requireEffectiveResident($request);
        $resident->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }
}
