import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';

const schema = z
    .object({
        password: z.string().min(8, 'At least 8 characters'),
        password_confirmation: z.string().min(1, 'Confirm your password'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = React.useState(false);

    const token = params.get('token') ?? '';
    const email = params.get('email') ?? '';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            await authApi.resetPassword({ token, email, ...values });
            toast.success('Password reset. You can now sign in.');
            navigate('/login', { replace: true });
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Reset password"
            description={email ? `Resetting password for ${email}` : 'Choose a new password'}
            footer={
                <Link to="/login" className="text-primary font-medium hover:underline">
                    Back to sign in
                </Link>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" type="password" {...register('password')} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input id="password_confirmation" type="password" {...register('password_confirmation')} aria-invalid={!!errors.password_confirmation} />
                    {errors.password_confirmation && <p className="text-destructive text-xs">{errors.password_confirmation.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={submitting || !token}>
                    {submitting && <Loader2Icon className="size-4 animate-spin" />}
                    Reset password
                </Button>
            </form>
        </AuthLayout>
    );
}
