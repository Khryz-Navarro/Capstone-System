import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { EmailVerificationAlert } from '@/components/email-verification-alert';
import { PageHeader } from '@/components/page-header';
import { VerificationBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { profileApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';
import { useResidentContext } from '@/hooks/use-resident-context';
import { ResidentSelectionAlert } from '@/components/resident-selection-alert';

export function ProfilePage() {
    const { user, authUser, needsResident } = useResidentContext();
    const queryClient = useQueryClient();
    const profile = user?.resident_profile;

    const [form, setForm] = React.useState({
        first_name: profile?.first_name ?? '',
        middle_name: profile?.middle_name ?? '',
        last_name: profile?.last_name ?? '',
        suffix: profile?.suffix ?? '',
        gender: profile?.gender ?? '',
        birthdate: profile?.birthdate ?? '',
        civil_status: profile?.civil_status ?? '',
        occupation: profile?.occupation ?? '',
        mobile_number: profile?.mobile_number ?? '',
        house_number: profile?.address.house_number ?? '',
        street: profile?.address.street ?? '',
        purok: profile?.address.purok ?? '',
        sitio: profile?.address.sitio ?? '',
        city: profile?.address.city ?? '',
        province: profile?.address.province ?? '',
        phone: user?.phone ?? '',
    });

    const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const update = useMutation({
        mutationFn: () => profileApi.update(form),
        onSuccess: (updated) => {
            queryClient.setQueryData(['super', 'acting-resident'], updated);
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
            toast.success('Profile updated.');
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
    });

    return (
        <div>
            {needsResident && <ResidentSelectionAlert />}
            {authUser?.role === 'resident' && !authUser.email_verified && <EmailVerificationAlert className="mb-4" />}
            <PageHeader
                title="Profile"
                description="Manage your personal and address information."
                action={profile && <VerificationBadge status={profile.verification_status} />}
            />

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    update.mutate();
                }}
                className="space-y-6"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field label="First Name">
                            <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
                        </Field>
                        <Field label="Middle Name">
                            <Input value={form.middle_name} onChange={(e) => set('middle_name', e.target.value)} />
                        </Field>
                        <Field label="Last Name">
                            <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
                        </Field>
                        <Field label="Suffix">
                            <Input value={form.suffix} onChange={(e) => set('suffix', e.target.value)} />
                        </Field>
                        <Field label="Gender">
                            <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Birthdate">
                            <Input type="date" value={form.birthdate ?? ''} onChange={(e) => set('birthdate', e.target.value)} />
                        </Field>
                        <Field label="Civil Status">
                            <Select value={form.civil_status} onValueChange={(v) => set('civil_status', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                    <SelectItem value="separated">Separated</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Occupation">
                            <Input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} />
                        </Field>
                        <Field label="Mobile Number">
                            <Input value={form.mobile_number} onChange={(e) => set('mobile_number', e.target.value)} />
                        </Field>
                        <Field label="Contact Phone">
                            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                        </Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Address</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <Field label="House Number">
                            <Input value={form.house_number} onChange={(e) => set('house_number', e.target.value)} />
                        </Field>
                        <Field label="Street">
                            <Input value={form.street} onChange={(e) => set('street', e.target.value)} />
                        </Field>
                        <Field label="Purok">
                            <Input value={form.purok} onChange={(e) => set('purok', e.target.value)} />
                        </Field>
                        <Field label="Sitio">
                            <Input value={form.sitio} onChange={(e) => set('sitio', e.target.value)} />
                        </Field>
                        <Field label="City">
                            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
                        </Field>
                        <Field label="Province">
                            <Input value={form.province} onChange={(e) => set('province', e.target.value)} />
                        </Field>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={update.isPending}>
                    {update.isPending && <Loader2Icon className="size-4 animate-spin" />}
                    Save changes
                </Button>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
