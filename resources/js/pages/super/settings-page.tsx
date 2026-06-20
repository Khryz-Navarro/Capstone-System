import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { superApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/errors';

interface FormState {
    app_name: string;
    support_email: string;
    allow_registration: boolean;
    maintenance_mode: boolean;
    ai_reports_enabled: boolean;
}

export function SystemSettingsPage() {
    const queryClient = useQueryClient();
    const [form, setForm] = React.useState<FormState | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['super', 'settings'],
        queryFn: superApi.settings.get,
    });

    React.useEffect(() => {
        if (data) {
            setForm({
                app_name: data.app_name,
                support_email: data.support_email,
                allow_registration: data.allow_registration === '1',
                maintenance_mode: data.maintenance_mode === '1',
                ai_reports_enabled: data.ai_reports_enabled === '1',
            });
        }
    }, [data]);

    const save = useMutation({
        mutationFn: () => superApi.settings.update(form!),
        onSuccess: (updated) => {
            queryClient.setQueryData(['super', 'settings'], updated);
            toast.success('Settings saved.');
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'Unable to save settings.')),
    });

    if (isLoading || !form) return <PageLoader />;

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f!, [key]: value }));

    return (
        <div>
            <PageHeader title="System Settings" description="Platform-wide configuration." />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-base">General</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            save.mutate();
                        }}
                    >
                        <div className="space-y-2">
                            <Label>Application name</Label>
                            <Input value={form.app_name} onChange={(e) => set('app_name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Support email</Label>
                            <Input
                                type="email"
                                value={form.support_email}
                                onChange={(e) => set('support_email', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Resident registration</Label>
                                <Select
                                    value={form.allow_registration ? '1' : '0'}
                                    onValueChange={(v) => set('allow_registration', v === '1')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Enabled</SelectItem>
                                        <SelectItem value="0">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Maintenance mode</Label>
                                <Select
                                    value={form.maintenance_mode ? '1' : '0'}
                                    onValueChange={(v) => set('maintenance_mode', v === '1')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">Off</SelectItem>
                                        <SelectItem value="1">On</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>AI report summaries</Label>
                            <Select
                                value={form.ai_reports_enabled ? '1' : '0'}
                                onValueChange={(v) => set('ai_reports_enabled', v === '1')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Disabled (rule-based only)</SelectItem>
                                    <SelectItem value="1">Enabled (requires GOOGLE_AI_API_KEY)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground text-xs">
                                When enabled and a Google AI Studio key is configured, summaries use Gemini. Otherwise, built-in
                                rule-based insights are used.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={save.isPending}>
                                {save.isPending && <Loader2Icon className="size-4 animate-spin" />}
                                Save settings
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
