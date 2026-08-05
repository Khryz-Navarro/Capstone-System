import * as React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3Icon,
    BellIcon,
    Building2Icon,
    FilePlus2Icon,
    FileStackIcon,
    FileTextIcon,
    InboxIcon,
    LayoutDashboardIcon,
    LogOutIcon,
    type LucideIcon,
    MenuIcon,
    SettingsIcon,
    ShieldCheckIcon,
    UserCogIcon,
    UserIcon,
    UsersIcon,
    XIcon,
} from 'lucide-react';
import { ActiveBarangaySelector } from '@/components/active-barangay-selector';
import { ActingBarangaySelector } from '@/components/acting-barangay-selector';
import { ActingResidentSelector } from '@/components/acting-resident-selector';
import { ResetActingContextButton } from '@/components/reset-acting-context-button';
import { BrandLogo } from '@/components/brand-logo';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationApi, superApi } from '@/lib/api';
import { isMobileApp } from '@/lib/platform';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

interface NavItem {
    to: string;
    label: string;
    icon: LucideIcon;
    end?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const residentNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
    { to: '/request', label: 'Request Document', icon: FilePlus2Icon },
    { to: '/requests', label: 'My Requests', icon: FileTextIcon },
    { to: '/residency', label: 'Residency', icon: ShieldCheckIcon },
    { to: '/profile', label: 'Profile', icon: UserIcon },
    { to: '/notifications', label: 'Notifications', icon: BellIcon },
];

const staffNav: NavItem[] = [
    { to: '/staff', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
    { to: '/staff/requests', label: 'Document Requests', icon: InboxIcon },
    { to: '/staff/residents', label: 'Residents', icon: UsersIcon },
];

const adminNav: NavItem[] = [
    { to: '/admin/reports', label: 'Reports', icon: BarChart3Icon },
    { to: '/admin/staff', label: 'Manage Staff', icon: UserCogIcon },
    { to: '/admin/document-types', label: 'Document Types', icon: FileStackIcon },
];

const superNav: NavItem[] = [
    { to: '/super', label: 'Analytics', icon: BarChart3Icon, end: true },
    { to: '/super/barangays', label: 'Barangays', icon: Building2Icon },
    { to: '/super/staff', label: 'Platform Staff', icon: UserCogIcon },
    { to: '/super/settings', label: 'System Settings', icon: SettingsIcon },
];

const isStaffRole = (role: string): boolean => role === 'barangay_staff' || role === 'barangay_admin';

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function buildNav(role: string): NavSection[] {
    if (role === 'super_admin') {
        return [
            { title: 'Platform', items: superNav },
            { title: 'Staff', items: staffNav },
            { title: 'Admin', items: adminNav },
            { title: 'Resident', items: residentNav },
        ];
    }

    if (role === 'barangay_admin') {
        return [{ title: 'Workspace', items: [...staffNav, ...adminNav] }];
    }

    if (role === 'barangay_staff') {
        return [{ title: 'Workspace', items: staffNav }];
    }

    return [{ title: 'Resident', items: residentNav }];
}

function homePathForRole(role: string): string {
    if (role === 'super_admin') return '/super';
    if (isStaffRole(role)) return '/staff';
    return '/dashboard';
}

export function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const isSuper = user?.role === 'super_admin';
    const showActiveBarangaySelector =
        isStaffRole(user.role) && !isSuper && (user.has_multiple_barangay_assignments ?? false);

    const { data: actingBarangay } = useQuery({
        queryKey: ['super', 'acting-barangay'],
        queryFn: superApi.actingBarangay.get,
        enabled: isSuper,
    });

    const { data: actingResident } = useQuery({
        queryKey: ['super', 'acting-resident'],
        queryFn: superApi.actingResident.get,
        enabled: isSuper,
    });

    const showResidentFeatures = user?.role === 'resident' || (isSuper && !!actingResident);

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: notificationApi.list,
        refetchInterval: 60_000,
        enabled: showResidentFeatures,
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    const navSections = buildNav(user.role);
    const homePath = homePathForRole(user.role);
    const residentSelectorDisabled = !actingBarangay;
    const nativeApp = isMobileApp();

    return (
        <div className={cn('bg-muted/30 min-h-screen', nativeApp && 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]')}>
            {/* Sidebar (desktop) */}
            <aside className="bg-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex">
                <div className="flex h-16 items-center border-b px-6">
                    <Link to={homePath}>
                        <BrandLogo />
                    </Link>
                </div>
                <nav className="flex-1 space-y-4 overflow-y-auto p-4">
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            {navSections.length > 1 && (
                                <p className="text-muted-foreground px-3 text-[11px] font-semibold tracking-wide uppercase">
                                    {section.title}
                                </p>
                            )}
                            {section.items.map((item) => (
                                <NavItemLink key={item.to} item={item} unread={notifications?.unread_count ?? 0} />
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="space-y-3 border-t p-4">
                    {isSuper && (
                        <>
                            <ActingBarangaySelector className="w-full" />
                            <ActingResidentSelector className="w-full" disabled={residentSelectorDisabled} />
                            <ResetActingContextButton className="w-full" />
                        </>
                    )}
                    {showActiveBarangaySelector && (
                        <ActiveBarangaySelector className="w-full" />
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                        {isSuper ? user.role_label : (user.barangay?.name ?? 'Barangay')}
                    </p>
                </div>
            </aside>

            {/* Mobile sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="bg-black/50" onClick={() => setMobileOpen(false)} aria-hidden />
                    <aside className="bg-sidebar absolute inset-y-0 left-0 flex w-64 flex-col border-r">
                        <div className="flex h-16 items-center justify-between border-b px-6">
                            <BrandLogo />
                            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                                <XIcon className="size-5" />
                            </Button>
                        </div>
                        <nav className="flex-1 space-y-4 overflow-y-auto p-4" onClick={() => setMobileOpen(false)}>
                            {navSections.map((section) => (
                                <div key={section.title} className="space-y-1">
                                    {navSections.length > 1 && (
                                        <p className="text-muted-foreground px-3 text-[11px] font-semibold tracking-wide uppercase">
                                            {section.title}
                                        </p>
                                    )}
                                    {section.items.map((item) => (
                                        <NavItemLink key={item.to} item={item} unread={notifications?.unread_count ?? 0} />
                                    ))}
                                </div>
                            ))}
                        </nav>
                        <div className="space-y-3 border-t p-4">
                            {isSuper && (
                                <>
                                    <ActingBarangaySelector className="w-full" />
                                    <ActingResidentSelector className="w-full" disabled={residentSelectorDisabled} />
                                    <ResetActingContextButton className="w-full" />
                                </>
                            )}
                            {showActiveBarangaySelector && <ActiveBarangaySelector className="w-full" />}
                        </div>
                    </aside>
                </div>
            )}

            {/* Main */}
            <div className="lg:pl-64">
                <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur lg:px-8">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                        <MenuIcon className="size-5" />
                    </Button>
                    {isSuper && (
                        <div className="hidden items-center gap-2 lg:flex">
                            <ActingBarangaySelector className="w-52" />
                            <ActingResidentSelector className="w-52" disabled={residentSelectorDisabled} />
                            <ResetActingContextButton />
                        </div>
                    )}
                    {showActiveBarangaySelector && (
                        <div className="hidden lg:block">
                            <ActiveBarangaySelector className="w-52" />
                        </div>
                    )}
                    <div className="flex-1" />
                    {showResidentFeatures && (
                        <Button variant="ghost" size="icon" className="relative" asChild>
                            <Link to="/notifications" aria-label="Notifications">
                                <BellIcon className="size-5" />
                                {(notifications?.unread_count ?? 0) > 0 && (
                                    <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" />
                                )}
                            </Link>
                        </Button>
                    )}
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2 px-2">
                                <Avatar>
                                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                                </Avatar>
                                <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-muted-foreground text-xs">{user.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {showResidentFeatures && (
                                <>
                                    <DropdownMenuItem asChild>
                                        <Link to="/profile">
                                            <UserIcon className="size-4" /> Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                                <LogOutIcon className="size-4" /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <main className="mx-auto w-full max-w-6xl p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function NavItemLink({ item, unread }: { item: NavItem; unread: number }) {
    const Icon = item.icon;
    return (
        <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )
            }
        >
            <Icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/notifications' && unread > 0 && (
                <span className="bg-destructive text-destructive-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px]">
                    {unread}
                </span>
            )}
        </NavLink>
    );
}
