import * as React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
    const [submitting, setSubmitting] = React.useState(false);
    const [sent, setSent] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            await authApi.forgotPassword(values.email);
            setSent(true);
            toast.success('Password reset link sent.');
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Forgot password"
            description="We'll email you a reset link"
            footer={
                <Link to="/login" className="text-primary font-medium hover:underline">
                    Back to sign in
                </Link>
            }
        >
            {sent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2Icon className="size-10 text-emerald-600" />
                    <p className="text-sm">If that email exists, a reset link is on its way. Check your inbox.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
                        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting && <Loader2Icon className="size-4 animate-spin" />}
                        Send reset link
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
}
