import { Link } from 'react-router-dom';
import {
    ArrowRightIcon,
    ClipboardCheckIcon,
    FileTextIcon,
    QrCodeIcon,
    ShieldCheckIcon,
    UploadCloudIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';

const features = [
    { icon: FileTextIcon, title: 'Request Online', description: 'Request barangay clearances, certificates, and more from anywhere.' },
    { icon: UploadCloudIcon, title: 'Verify Residency', description: 'Upload proof of residency once and get verified by barangay staff.' },
    { icon: ClipboardCheckIcon, title: 'Track Status', description: 'Follow each request from submission to ready-for-pickup in real time.' },
    { icon: QrCodeIcon, title: 'QR-Verified Documents', description: 'Every certificate carries a QR code for instant authenticity checks.' },
];

const steps = [
    { step: '01', title: 'Register & Select Barangay', text: 'Create an account and choose your barangay.' },
    { step: '02', title: 'Verify Residency', text: 'Upload a valid proof of residency for approval.' },
    { step: '03', title: 'Request Documents', text: 'Submit a request for the document you need.' },
    { step: '04', title: 'Pick Up & Pay Onsite', text: 'Collect your document at the barangay hall and pay the fee.' },
];

export function LandingPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="bg-background min-h-screen">
            <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <BrandLogo />
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        {isAuthenticated ? (
                            <Button asChild>
                                <Link to="/dashboard">Dashboard</Link>
                            </Button>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link to="/login">Sign in</Link>
                                </Button>
                                <Button asChild>
                                    <Link to="/register">Register</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <section className="relative overflow-hidden">
                <div className="from-primary/10 absolute inset-0 -z-10 bg-gradient-to-b to-transparent" />
                <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
                    <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
                        <ShieldCheckIcon className="size-3.5" /> Official Barangay Document Portal
                    </span>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                        Barangay documents, <span className="text-primary">requested online</span>
                    </h1>
                    <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty">
                        A multi-tenant platform for residents to request official barangay documents, track their status, and
                        pick them up at the barangay hall. Fees are paid onsite.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Button size="lg" asChild>
                            <Link to="/register">
                                Get started <ArrowRightIcon className="size-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link to="/login">Sign in</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-16">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((f) => (
                        <Card key={f.title}>
                            <CardContent className="space-y-3">
                                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                                    <f.icon className="size-5" />
                                </div>
                                <h3 className="font-semibold">{f.title}</h3>
                                <p className="text-muted-foreground text-sm">{f.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="bg-muted/40 border-y">
                <div className="mx-auto max-w-6xl px-4 py-16">
                    <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((s) => (
                            <div key={s.step} className="space-y-2">
                                <div className="text-primary text-3xl font-bold">{s.step}</div>
                                <h3 className="font-semibold">{s.title}</h3>
                                <p className="text-muted-foreground text-sm">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t">
                <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row">
                    <BrandLogo showText />
                    <p>© {new Date().getFullYear()} MT-BDRS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
