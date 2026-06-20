export type UserRole = 'super_admin' | 'barangay_admin' | 'barangay_staff' | 'resident';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type RequestStatus =
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'certificate_generated'
    | 'ready_for_pickup'
    | 'released';

export interface Barangay {
    id: number;
    name: string;
    code: string;
    region: string | null;
    province: string | null;
    city: string | null;
    contact_number: string | null;
    official_email: string | null;
    captain: string | null;
    status: string;
    tenant?: { id: number; name: string; status: string };
    residents_count?: number;
    staff_count?: number;
    requests_count?: number;
    created_at?: string | null;
}

export interface ResidentProfile {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    full_name: string;
    gender: string | null;
    birthdate: string | null;
    civil_status: string | null;
    occupation: string | null;
    mobile_number: string | null;
    address: {
        house_number: string | null;
        street: string | null;
        purok: string | null;
        sitio: string | null;
        city: string | null;
        province: string | null;
    };
    verification_status: VerificationStatus;
    verified_at: string | null;
    rejection_reason: string | null;
}

export interface User {
    id: number;
    name: string;
    username: string | null;
    email: string;
    phone: string | null;
    role: UserRole;
    role_label: string;
    tenant_id: number | null;
    barangay_id: number | null;
    email_verified: boolean;
    barangay?: Barangay;
    assigned_barangays?: Barangay[];
    has_multiple_barangay_assignments?: boolean;
    resident_profile?: ResidentProfile;
    staff_profile?: StaffProfile;
    last_login_at: string | null;
    created_at: string | null;
}

export interface DocumentType {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    fee: number;
    requires_purpose: boolean;
    is_active: boolean;
    requests_count?: number;
}

export interface DocumentTemplate {
    id: number;
    document_type_id: number;
    name: string;
    body: string;
    is_default: boolean;
    document_type?: DocumentType;
    created_at: string | null;
}

export interface StaffProfile {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    position: string | null;
    mobile_number: string | null;
    is_active: boolean;
}

export interface SuperStaffPayload {
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
    barangay_ids: number[];
}

export interface ResidencyProof {
    id: number;
    type: string;
    type_label: string;
    original_name: string;
    mime_type: string;
    size: number;
    status: VerificationStatus;
    notes: string | null;
    reviewed_at: string | null;
    created_at: string | null;
}

export interface RequestStatusLog {
    id: number;
    from_status: RequestStatus | null;
    to_status: RequestStatus;
    to_status_label: string;
    remarks: string | null;
    actor?: { id: number; name: string };
    created_at: string | null;
}

export interface DocumentRequest {
    id: number;
    reference_number: string;
    certificate_number: string | null;
    status: RequestStatus;
    status_label: string;
    purpose: string | null;
    fee: number;
    remarks: string | null;
    has_pdf: boolean;
    document_type?: DocumentType;
    resident?: User;
    status_logs?: RequestStatusLog[];
    approved_at: string | null;
    generated_at: string | null;
    released_at: string | null;
    created_at: string | null;
}

export interface AppNotification {
    id: string;
    type: string;
    data: Record<string, unknown>;
    read: boolean;
    read_at: string | null;
    created_at: string | null;
}

export interface Paginated<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface StaffDashboard {
    residents: {
        total: number;
        pending_verification: number;
    };
    requests: {
        total: number;
        submitted: number;
        approved: number;
        generated: number;
        ready_for_pickup: number;
        released: number;
    };
    recent_requests: DocumentRequest[];
}

export interface ResidentDetail {
    resident: User;
    proofs: ResidencyProof[];
}

export interface AdminReport {
    totals: {
        residents: number;
        pending_verification: number;
        staff: number;
        document_types: number;
        requests: number;
        released: number;
    };
    requests_by_status: { status: RequestStatus; label: string; total: number }[];
    requests_by_month: { month: string; label: string; total: number }[];
    most_requested: { name: string; total: number }[];
}

export interface SuperAnalytics {
    totals: {
        barangays: number;
        active_barangays: number;
        tenants: number;
        residents: number;
        staff: number;
        requests: number;
        released: number;
    };
    top_barangays: { name: string; residents: number; requests: number }[];
    monthly_registrations: { month: string; label: string; total: number }[];
    document_trends: { name: string; total: number }[];
}

export interface SystemSettings {
    app_name: string;
    support_email: string;
    allow_registration: string;
    maintenance_mode: string;
    ai_reports_enabled: string;
}

export interface ReportSummary {
    summary: string;
    highlights: string[];
    generated_at: string;
    source: 'ai' | 'rules';
}

export type ReportSummaryResponse =
    | { status: 'none' }
    | { status: 'pending' }
    | { status: 'ready'; data: ReportSummary };

export interface VerificationResult {
    valid: boolean;
    message?: string;
    reference_number?: string;
    certificate_number?: string | null;
    document_type?: string;
    resident_name?: string;
    barangay?: string;
    city?: string | null;
    province?: string | null;
    status?: RequestStatus;
    status_label?: string;
    issued_at?: string | null;
}
