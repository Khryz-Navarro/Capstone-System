import api, { ensureCsrf } from '@/lib/axios';
import { downloadAuthenticatedFile, openAuthenticatedFile } from '@/lib/download';
import type {
    AdminReport,
    AppNotification,
    Barangay,
    DocumentRequest,
    DocumentTemplate,
    DocumentType,
    Paginated,
    ReportSummaryResponse,
    ResidencyProof,
    ResidentDetail,
    StaffDashboard,
    SuperAnalytics,
    SuperStaffPayload,
    SystemSettings,
    User,
    VerificationResult,
} from '@/types';

export interface BarangayPayload {
    name: string;
    code: string;
    region?: string;
    province?: string;
    city?: string;
    contact_number?: string;
    official_email?: string;
    captain?: string;
}

export interface StaffPayload {
    first_name: string;
    last_name: string;
    position: string;
    mobile_number?: string;
    email: string;
    username?: string;
    role: 'barangay_staff' | 'barangay_admin';
    is_active?: boolean;
    password?: string;
    password_confirmation?: string;
}

export interface DocumentTypePayload {
    name: string;
    description?: string;
    fee: number;
    requires_purpose: boolean;
    is_active: boolean;
}

export interface DocumentTemplatePayload {
    document_type_id?: number;
    name: string;
    body: string;
    is_default: boolean;
}

export interface RegisterPayload {
    barangay_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    gender: string;
    birthdate: string;
    civil_status: string;
    occupation?: string;
    mobile_number: string;
    house_number?: string;
    street?: string;
    purok?: string;
    sitio?: string;
    city: string;
    province: string;
    username?: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export const activeBarangayApi = {
    async get(): Promise<Barangay | null> {
        const { data } = await api.get<{ data: Barangay | null }>('/active-barangay');
        return data.data;
    },
    async options(): Promise<Barangay[]> {
        const { data } = await api.get<{ data: Barangay[] }>('/active-barangay/options');
        return data.data;
    },
    async set(barangayId: number | null): Promise<Barangay | null> {
        await ensureCsrf();
        const { data } = await api.put<{ data: Barangay | null }>('/active-barangay', {
            barangay_id: barangayId,
        });
        return data.data;
    },
};

export const authApi = {
    async user(): Promise<User> {
        const { data } = await api.get<{ data: User }>('/user');
        return data.data;
    },
    async login(login: string, password: string, remember: boolean): Promise<User> {
        await ensureCsrf();
        const { data } = await api.post<{ data: User }>('/auth/login', { login, password, remember });
        return data.data;
    },
    async register(payload: RegisterPayload): Promise<User> {
        await ensureCsrf();
        const { data } = await api.post<{ data: User }>('/auth/register', payload);
        return data.data;
    },
    async logout(): Promise<void> {
        await ensureCsrf();
        await api.post('/auth/logout');
    },
    async forgotPassword(email: string): Promise<string> {
        await ensureCsrf();
        const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
        return data.message;
    },
    async resetPassword(payload: {
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    }): Promise<string> {
        await ensureCsrf();
        const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
        return data.message;
    },
    async resendVerification(): Promise<string> {
        await ensureCsrf();
        const { data } = await api.post<{ message: string }>('/auth/email/verification-notification');
        return data.message;
    },
};

export const barangayApi = {
    async list(): Promise<Barangay[]> {
        const { data } = await api.get<{ data: Barangay[] }>('/barangays');
        return data.data;
    },
};

export const profileApi = {
    async get(): Promise<User> {
        const { data } = await api.get<{ data: User }>('/profile');
        return data.data;
    },
    async update(payload: Record<string, unknown>): Promise<User> {
        await ensureCsrf();
        const { data } = await api.put<{ data: User }>('/profile', payload);
        return data.data;
    },
};

export const residencyApi = {
    async list(): Promise<ResidencyProof[]> {
        const { data } = await api.get<{ data: ResidencyProof[] }>('/residency');
        return data.data;
    },
    async upload(type: string, file: File): Promise<ResidencyProof> {
        await ensureCsrf();
        const form = new FormData();
        form.append('type', type);
        form.append('file', file);
        const { data } = await api.post<{ data: ResidencyProof }>('/residency/upload', form);
        return data.data;
    },
};

export const documentTypeApi = {
    async list(): Promise<DocumentType[]> {
        const { data } = await api.get<{ data: DocumentType[] }>('/document-types');
        return data.data;
    },
};

export const documentRequestApi = {
    async list(page = 1): Promise<Paginated<DocumentRequest>> {
        const { data } = await api.get<Paginated<DocumentRequest>>('/document-requests', { params: { page } });
        return data;
    },
    async get(id: number): Promise<DocumentRequest> {
        const { data } = await api.get<{ data: DocumentRequest }>(`/document-requests/${id}`);
        return data.data;
    },
    async create(payload: { document_type_id: number; purpose?: string }): Promise<DocumentRequest> {
        await ensureCsrf();
        const { data } = await api.post<{ data: DocumentRequest }>('/document-requests', payload);
        return data.data;
    },
    async download(id: number): Promise<void> {
        await downloadAuthenticatedFile(`/document-requests/${id}/download`);
    },
    async open(id: number): Promise<void> {
        await openAuthenticatedFile(`/document-requests/${id}/download?inline=1`);
    },
};

export const staffApi = {
    async dashboard(): Promise<StaffDashboard> {
        const { data } = await api.get<StaffDashboard>('/staff/dashboard');
        return data;
    },
    residents: {
        async list(params: { status?: string; search?: string; barangayId?: number; page?: number }): Promise<Paginated<User>> {
            const { data } = await api.get<Paginated<User>>('/staff/residents', {
                params: {
                    status: params.status || undefined,
                    search: params.search || undefined,
                    barangay_id: params.barangayId || undefined,
                    page: params.page,
                },
            });
            return data;
        },
        async get(id: number): Promise<ResidentDetail> {
            const { data } = await api.get<ResidentDetail>(`/staff/residents/${id}`);
            return data;
        },
        async approve(id: number): Promise<void> {
            await ensureCsrf();
            await api.post(`/staff/residents/${id}/approve`);
        },
        async reject(id: number, reason: string): Promise<void> {
            await ensureCsrf();
            await api.post(`/staff/residents/${id}/reject`, { reason });
        },
        async resendVerification(id: number): Promise<string> {
            await ensureCsrf();
            const { data } = await api.post<{ message: string }>(`/staff/residents/${id}/resend-verification`);
            return data.message;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/staff/residents/${id}`);
        },
        async downloadProof(proofId: number): Promise<void> {
            await downloadAuthenticatedFile(`/staff/residency-proofs/${proofId}/download`);
        },
        async viewProof(proofId: number): Promise<void> {
            await openAuthenticatedFile(`/staff/residency-proofs/${proofId}/download?inline=1`);
        },
    },
    requests: {
        async list(params: { status?: string; search?: string; page?: number }): Promise<Paginated<DocumentRequest>> {
            const { data } = await api.get<Paginated<DocumentRequest>>('/staff/document-requests', {
                params: {
                    status: params.status || undefined,
                    search: params.search || undefined,
                    page: params.page ?? 1,
                },
            });
            return data;
        },
        async get(id: number): Promise<DocumentRequest> {
            const { data } = await api.get<{ data: DocumentRequest }>(`/staff/document-requests/${id}`);
            return data.data;
        },
        async approve(id: number, remarks?: string): Promise<DocumentRequest> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentRequest }>(`/staff/document-requests/${id}/approve`, { remarks });
            return data.data;
        },
        async reject(id: number, remarks: string): Promise<DocumentRequest> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentRequest }>(`/staff/document-requests/${id}/reject`, { remarks });
            return data.data;
        },
        async generate(id: number): Promise<DocumentRequest> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentRequest }>(`/staff/document-requests/${id}/generate`);
            return data.data;
        },
        async markReady(id: number): Promise<DocumentRequest> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentRequest }>(`/staff/document-requests/${id}/ready`);
            return data.data;
        },
        async release(id: number, remarks?: string): Promise<DocumentRequest> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentRequest }>(`/staff/document-requests/${id}/release`, { remarks });
            return data.data;
        },
        async download(id: number): Promise<void> {
            await downloadAuthenticatedFile(`/staff/document-requests/${id}/download`);
        },
        async open(id: number): Promise<void> {
            await openAuthenticatedFile(`/staff/document-requests/${id}/download?inline=1`);
        },
    },
};

export const adminApi = {
    async reports(): Promise<AdminReport> {
        const { data } = await api.get<AdminReport>('/admin/reports');
        return data;
    },
    async reportSummary(): Promise<ReportSummaryResponse> {
        const { data } = await api.get<ReportSummaryResponse>('/admin/reports/summary');
        return data;
    },
    async generateReportSummary(refresh = false): Promise<ReportSummaryResponse> {
        await ensureCsrf();
        const { data } = await api.post<ReportSummaryResponse>('/admin/reports/summary', null, {
            params: refresh ? { refresh: 1 } : undefined,
        });
        return data;
    },
    staff: {
        async list(page = 1): Promise<Paginated<User>> {
            const { data } = await api.get<Paginated<User>>('/admin/staff', { params: { page } });
            return data;
        },
        async create(payload: StaffPayload): Promise<User> {
            await ensureCsrf();
            const { data } = await api.post<{ data: User }>('/admin/staff', payload);
            return data.data;
        },
        async update(id: number, payload: StaffPayload): Promise<User> {
            await ensureCsrf();
            const { data } = await api.put<{ data: User }>(`/admin/staff/${id}`, payload);
            return data.data;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/admin/staff/${id}`);
        },
    },
    documentTypes: {
        async list(): Promise<DocumentType[]> {
            const { data } = await api.get<{ data: DocumentType[] }>('/admin/document-types');
            return data.data;
        },
        async create(payload: DocumentTypePayload): Promise<DocumentType> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentType }>('/admin/document-types', payload);
            return data.data;
        },
        async update(id: number, payload: DocumentTypePayload): Promise<DocumentType> {
            await ensureCsrf();
            const { data } = await api.put<{ data: DocumentType }>(`/admin/document-types/${id}`, payload);
            return data.data;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/admin/document-types/${id}`);
        },
    },
    templates: {
        async list(documentTypeId?: number): Promise<DocumentTemplate[]> {
            const { data } = await api.get<{ data: DocumentTemplate[] }>('/admin/document-templates', {
                params: { document_type_id: documentTypeId },
            });
            return data.data;
        },
        async create(payload: DocumentTemplatePayload): Promise<DocumentTemplate> {
            await ensureCsrf();
            const { data } = await api.post<{ data: DocumentTemplate }>('/admin/document-templates', payload);
            return data.data;
        },
        async update(id: number, payload: DocumentTemplatePayload): Promise<DocumentTemplate> {
            await ensureCsrf();
            const { data } = await api.put<{ data: DocumentTemplate }>(`/admin/document-templates/${id}`, payload);
            return data.data;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/admin/document-templates/${id}`);
        },
    },
};

export const superApi = {
    async analytics(): Promise<SuperAnalytics> {
        const { data } = await api.get<SuperAnalytics>('/super/analytics');
        return data;
    },
    async analyticsSummary(): Promise<ReportSummaryResponse> {
        const { data } = await api.get<ReportSummaryResponse>('/super/analytics/summary');
        return data;
    },
    async generateAnalyticsSummary(refresh = false): Promise<ReportSummaryResponse> {
        await ensureCsrf();
        const { data } = await api.post<ReportSummaryResponse>('/super/analytics/summary', null, {
            params: refresh ? { refresh: 1 } : undefined,
        });
        return data;
    },
    actingBarangay: {
        async get(): Promise<Barangay | null> {
            const { data } = await api.get<{ data: Barangay | null }>('/super/acting-barangay');
            return data.data;
        },
        async set(barangayId: number | null): Promise<Barangay | null> {
            await ensureCsrf();
            const { data } = await api.put<{ data: Barangay | null }>('/super/acting-barangay', {
                barangay_id: barangayId,
            });
            return data.data;
        },
    },
    actingResident: {
        async get(): Promise<User | null> {
            const { data } = await api.get<{ data: User | null }>('/super/acting-resident');
            return data.data;
        },
        async options(): Promise<Array<{ id: number; name: string; email: string }>> {
            const { data } = await api.get<{ data: Array<{ id: number; name: string; email: string }> }>(
                '/super/acting-resident/options',
            );
            return data.data;
        },
        async set(residentId: number | null): Promise<User | null> {
            await ensureCsrf();
            const { data } = await api.put<{ data: User | null }>('/super/acting-resident', {
                resident_id: residentId,
            });
            return data.data;
        },
    },
    actingContext: {
        async reset(): Promise<void> {
            await ensureCsrf();
            await api.delete('/super/acting-context');
        },
    },
    barangays: {
        async list(params: { search?: string; status?: string; page?: number }): Promise<Paginated<Barangay>> {
            const { data } = await api.get<Paginated<Barangay>>('/super/barangays', {
                params: {
                    search: params.search || undefined,
                    status: params.status || undefined,
                    page: params.page ?? 1,
                },
            });
            return data;
        },
        async create(payload: BarangayPayload): Promise<Barangay> {
            await ensureCsrf();
            const { data } = await api.post<{ data: Barangay }>('/super/barangays', payload);
            return data.data;
        },
        async update(id: number, payload: BarangayPayload): Promise<Barangay> {
            await ensureCsrf();
            const { data } = await api.put<{ data: Barangay }>(`/super/barangays/${id}`, payload);
            return data.data;
        },
        async setStatus(id: number, status: string): Promise<Barangay> {
            await ensureCsrf();
            const { data } = await api.patch<{ data: Barangay }>(`/super/barangays/${id}/status`, { status });
            return data.data;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/super/barangays/${id}`);
        },
    },
    staff: {
        async list(params: { page?: number; barangayId?: number } = {}): Promise<Paginated<User>> {
            const { data } = await api.get<Paginated<User>>('/super/staff', {
                params: {
                    page: params.page ?? 1,
                    barangay_id: params.barangayId || undefined,
                },
            });
            return data;
        },
        async create(payload: SuperStaffPayload): Promise<User> {
            await ensureCsrf();
            const { data } = await api.post<{ data: User }>('/super/staff', payload);
            return data.data;
        },
        async update(id: number, payload: SuperStaffPayload): Promise<User> {
            await ensureCsrf();
            const { data } = await api.put<{ data: User }>(`/super/staff/${id}`, payload);
            return data.data;
        },
        async remove(id: number): Promise<void> {
            await ensureCsrf();
            await api.delete(`/super/staff/${id}`);
        },
    },
    settings: {
        async get(): Promise<SystemSettings> {
            const { data } = await api.get<{ data: SystemSettings }>('/super/settings');
            return data.data;
        },
        async update(payload: {
            app_name: string;
            support_email: string;
            allow_registration: boolean;
            maintenance_mode: boolean;
            ai_reports_enabled: boolean;
        }): Promise<SystemSettings> {
            await ensureCsrf();
            const { data } = await api.put<{ data: SystemSettings }>('/super/settings', payload);
            return data.data;
        },
    },
};

export const verifyApi = {
    async check(reference: string): Promise<VerificationResult> {
        const { data } = await api.get<VerificationResult>(`/verify/${encodeURIComponent(reference)}`, {
            validateStatus: (status) => status === 200 || status === 404,
        });
        return data;
    },
};

export const notificationApi = {
    async list(): Promise<{ data: AppNotification[]; unread_count: number }> {
        const { data } = await api.get<{ data: AppNotification[]; unread_count: number }>('/notifications');
        return data;
    },
    async markRead(id: string): Promise<void> {
        await ensureCsrf();
        await api.post(`/notifications/${id}/read`);
    },
    async markAllRead(): Promise<void> {
        await ensureCsrf();
        await api.post('/notifications/read-all');
    },
};
