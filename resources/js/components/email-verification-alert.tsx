import { useMutation } from '@tanstack/react-query';
import { Loader2Icon, MailWarningIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';

export function EmailVerificationAlert({ className }: { className?: string }) {
    const resend = useMutation({
        mutationFn: authApi.resendVerification,
        onSuccess: (message) => toast.success(message),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to send verification email.')),
    });

    return (
        <Alert className={cn(className)}>
            <MailWarningIcon />
            <AlertTitle>Verify your email</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Check your inbox for the verification link, or resend it if you did not receive the email.</span>
                <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => resend.mutate()}
                    disabled={resend.isPending}
                >
                    {resend.isPending && <Loader2Icon className="size-4 animate-spin" />}
                    Resend verification email
                </Button>
            </AlertDescription>
        </Alert>
    );
}
