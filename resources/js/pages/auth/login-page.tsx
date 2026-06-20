import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { roleHome } from '@/lib/navigation';
import { useAuth } from '@/providers/auth-provider';

const schema = z.object({
    login: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [submitting, setSubmitting] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { remember: false } });

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            const user = await authApi.login(values.login, values.password, !!values.remember);
            setUser(user);
            toast.success(`Welcome back, ${user.name}!`);
            const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
            navigate(from ?? roleHome(user.role), { replace: true });
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Invalid credentials.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthLayout
            title="Sign in"
            description="Access your barangay document portal"
            footer={
                <>
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary font-medium hover:underline">
                        Register here
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="login">Email or Username</Label>
                    <Input id="login" autoComplete="username" {...register('login')} aria-invalid={!!errors.login} />
                    {errors.login && <p className="text-destructive text-xs">{errors.login.message}</p>}
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link to="/forgot-password" className="text-primary text-xs hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <Input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} />
                    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-primary size-4 rounded" {...register('remember')} />
                    Remember me
                </label>
                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2Icon className="size-4 animate-spin" />}
                    Sign in
                </Button>
            </form>
        </AuthLayout>
    );
}
