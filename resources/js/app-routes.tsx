import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { GuestRoute, MobileBlockedRoute, ProtectedRoute } from '@/components/route-guards';
import { DocumentTemplatesPage } from '@/pages/admin/document-templates-page';
import { DocumentTypesPage } from '@/pages/admin/document-types-page';
import { ReportsPage } from '@/pages/admin/reports-page';
import { StaffListPage } from '@/pages/admin/staff-list-page';
import { EmailVerifiedPage } from '@/pages/auth/email-verified-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { ResetPasswordPage } from '@/pages/auth/reset-password-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { LandingPage } from '@/pages/public/landing-page';
import { VerifyDocumentPage } from '@/pages/public/verify-page';
import { DashboardPage } from '@/pages/resident/dashboard-page';
import { NotificationsPage } from '@/pages/resident/notifications-page';
import { ProfilePage } from '@/pages/resident/profile-page';
import { RequestDetailPage } from '@/pages/resident/request-detail-page';
import { RequestDocumentPage } from '@/pages/resident/request-document-page';
import { RequestHistoryPage } from '@/pages/resident/request-history-page';
import { ResidencyPage } from '@/pages/resident/residency-page';
import { RequestQueuePage } from '@/pages/staff/request-queue-page';
import { RequestReviewPage } from '@/pages/staff/request-review-page';
import { ResidentDetailPage } from '@/pages/staff/resident-detail-page';
import { ResidentListPage } from '@/pages/staff/resident-list-page';
import { StaffDashboardPage } from '@/pages/staff/staff-dashboard-page';
import { SuperAnalyticsPage } from '@/pages/super/analytics-page';
import { BarangaysPage } from '@/pages/super/barangays-page';
import { SuperStaffListPage } from '@/pages/super/staff-list-page';
import { SystemSettingsPage } from '@/pages/super/settings-page';

export function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/email-verified" element={<EmailVerifiedPage />} />
            <Route path="/verify" element={<VerifyDocumentPage />} />
            <Route path="/verify/:reference" element={<VerifyDocumentPage />} />

            <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['resident']} />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/request" element={<RequestDocumentPage />} />
                    <Route path="/requests" element={<RequestHistoryPage />} />
                    <Route path="/requests/:id" element={<RequestDetailPage />} />
                    <Route path="/residency" element={<ResidencyPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['barangay_staff', 'barangay_admin', 'super_admin']} />}>
                <Route element={<MobileBlockedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/staff" element={<StaffDashboardPage />} />
                        <Route path="/staff/requests" element={<RequestQueuePage />} />
                        <Route path="/staff/requests/:id" element={<RequestReviewPage />} />
                        <Route path="/staff/residents" element={<ResidentListPage />} />
                        <Route path="/staff/residents/:id" element={<ResidentDetailPage />} />
                    </Route>
                </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['barangay_admin', 'super_admin']} />}>
                <Route element={<MobileBlockedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/admin/reports" element={<ReportsPage />} />
                        <Route path="/admin/staff" element={<StaffListPage />} />
                        <Route path="/admin/document-types" element={<DocumentTypesPage />} />
                        <Route path="/admin/document-types/:typeId/templates" element={<DocumentTemplatesPage />} />
                    </Route>
                </Route>
            </Route>

            <Route element={<ProtectedRoute roles={['super_admin']} />}>
                <Route element={<MobileBlockedRoute />}>
                    <Route element={<DashboardLayout />}>
                        <Route path="/super" element={<SuperAnalyticsPage />} />
                        <Route path="/super/barangays" element={<BarangaysPage />} />
                        <Route path="/super/staff" element={<SuperStaffListPage />} />
                        <Route path="/super/settings" element={<SystemSettingsPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
