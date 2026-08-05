import { LogOutIcon, MonitorIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';

export function MobileUnsupportedPage() {
    const { user, logout } = useAuth();

    return (
        <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="bg-muted mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
                        <MonitorIcon className="text-muted-foreground size-6" />
                    </div>
                    <CardTitle>Web browser required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-muted-foreground text-sm">
                        The DocuLink mobile app is for residents only. Staff and admin accounts must use the web
                        application in a browser.
                    </p>
                    {user && (
                        <p className="text-sm">
                            Signed in as <span className="font-medium">{user.name}</span> ({user.role_label})
                        </p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => logout()}>
                        <LogOutIcon className="size-4" />
                        Sign out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
