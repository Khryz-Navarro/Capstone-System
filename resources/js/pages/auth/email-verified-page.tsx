import { Link } from 'react-router-dom';
import { CheckCircle2Icon } from 'lucide-react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';

export function EmailVerifiedPage() {
    return (
        <AuthLayout title="Email verified" description="Your email address has been confirmed">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
                <CheckCircle2Icon className="size-12 text-emerald-600" />
                <p className="text-muted-foreground text-sm">
                    Thank you for verifying your email. You can now continue using your account.
                </p>
                <Button asChild className="w-full">
                    <Link to="/dashboard">Go to dashboard</Link>
                </Button>
            </div>
        </AuthLayout>
    );
}
