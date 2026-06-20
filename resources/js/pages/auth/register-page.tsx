import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { authApi, barangayApi, type RegisterPayload } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

const schema = z
    .object({
        barangay_id: z.string().min(1, 'Please select your barangay'),
        first_name: z.string().min(1, 'Required'),
        middle_name: z.string().optional(),
        last_name: z.string().min(1, 'Required'),
        suffix: z.string().optional(),
        gender: z.string().min(1, 'Required'),
        birthdate: z.string().min(1, 'Required'),
        civil_status: z.string().min(1, 'Required'),
        occupation: z.string().optional(),
        mobile_number: z.string().min(1, 'Required'),
        house_number: z.string().optional(),
        street: z.string().optional(),
        purok: z.string().optional(),
        sitio: z.string().optional(),
        city: z.string().min(1, 'Required'),
        province: z.string().min(1, 'Required'),
        username: z.string().optional(),
        email: z.string().email('Enter a valid email'),
        password: z.string().min(8, 'At least 8 characters'),
        password_confirmation: z.string().min(1, 'Confirm your password'),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

type FormValues = z.infer<typeof schema>;

const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
];

const civilStatuses = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
    { value: 'divorced', label: 'Divorced' },
];

export function RegisterPage() {
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = React.useState(false);

    const { data: barangays, isLoading: loadingBarangays } = useQuery({
        queryKey: ['barangays'],
        queryFn: barangayApi.list,
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { city: 'Kidapawan City', province: 'Cotabato' },
    });

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            const payload: RegisterPayload = {
                ...values,
                barangay_id: Number(values.barangay_id),
            };
            const user = await authApi.register(payload);
            setUser(user);
            toast.success('Account created! Please verify your email and upload residency proof.');
            navigate('/dashboard', { replace: true });
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Registration failed.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-muted/30 flex min-h-screen flex-col items-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <div className="mb-6 flex justify-center">
                    <Link to="/">
                        <span className="text-primary text-xl font-bold">MT-BDRS</span>
                    </Link>
                </div>
                <div className="bg-card rounded-xl border p-6 shadow-sm sm:p-8">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Create your resident account</h1>
                        <p className="text-muted-foreground text-sm">Select your barangay and fill in your details</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <section className="space-y-2">
                            <Label>Barangay</Label>
                            <Select
                                value={watch('barangay_id')}
                                onValueChange={(v) => setValue('barangay_id', v, { shouldValidate: true })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={loadingBarangays ? 'Loading...' : 'Select your barangay'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {barangays?.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.barangay_id && <p className="text-destructive text-xs">{errors.barangay_id.message}</p>}
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold">Personal Information</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="First Name" error={errors.first_name?.message}>
                                    <Input {...register('first_name')} />
                                </Field>
                                <Field label="Middle Name">
                                    <Input {...register('middle_name')} />
                                </Field>
                                <Field label="Last Name" error={errors.last_name?.message}>
                                    <Input {...register('last_name')} />
                                </Field>
                                <Field label="Suffix">
                                    <Input placeholder="Jr., Sr., III" {...register('suffix')} />
                                </Field>
                                <Field label="Gender" error={errors.gender?.message}>
                                    <Select value={watch('gender')} onValueChange={(v) => setValue('gender', v, { shouldValidate: true })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {genders.map((g) => (
                                                <SelectItem key={g.value} value={g.value}>
                                                    {g.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Birthdate" error={errors.birthdate?.message}>
                                    <Input type="date" {...register('birthdate')} />
                                </Field>
                                <Field label="Civil Status" error={errors.civil_status?.message}>
                                    <Select value={watch('civil_status')} onValueChange={(v) => setValue('civil_status', v, { shouldValidate: true })}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {civilStatuses.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Occupation">
                                    <Input {...register('occupation')} />
                                </Field>
                                <Field label="Mobile Number" error={errors.mobile_number?.message}>
                                    <Input placeholder="09xxxxxxxxx" {...register('mobile_number')} />
                                </Field>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold">Address Information</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="House Number">
                                    <Input {...register('house_number')} />
                                </Field>
                                <Field label="Street">
                                    <Input {...register('street')} />
                                </Field>
                                <Field label="Purok">
                                    <Input {...register('purok')} />
                                </Field>
                                <Field label="Sitio">
                                    <Input {...register('sitio')} />
                                </Field>
                                <Field label="City" error={errors.city?.message}>
                                    <Input {...register('city')} />
                                </Field>
                                <Field label="Province" error={errors.province?.message}>
                                    <Input {...register('province')} />
                                </Field>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-sm font-semibold">Account Credentials</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Username (optional)">
                                    <Input {...register('username')} />
                                </Field>
                                <Field label="Email" error={errors.email?.message}>
                                    <Input type="email" {...register('email')} />
                                </Field>
                                <Field label="Password" error={errors.password?.message}>
                                    <Input type="password" {...register('password')} />
                                </Field>
                                <Field label="Confirm Password" error={errors.password_confirmation?.message}>
                                    <Input type="password" {...register('password_confirmation')} />
                                </Field>
                            </div>
                        </section>

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting && <Loader2Icon className="size-4 animate-spin" />}
                            Create account
                        </Button>
                    </form>
                </div>
                <p className="text-muted-foreground mt-6 text-center text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
