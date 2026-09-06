# Copilot Instructions — Capstone System (Barangay/Resident Portal)

## Project Overview
This repo contains two main parts:
- **Backend**: Laravel (PHP) — handles API endpoints, auth, document/certificate generation, and admin approval workflows.
- **Mobile**: Expo / React Native (TypeScript) — resident-facing app for sign-in, registration, ID verification, and certificate requests.

## Backend Stack
- Framework: **Laravel**
- Database: **SQLite** (`database/database.mobile.sqlite`) for development
- Testing: **Pest** (see `tests/Feature`, `tests/Unit`)
- Key service classes live in `app/Services` (e.g., `CertificateGenerator.php`, `DocumentRequestService.php`) — keep business logic here, not in controllers.

## Conventions
- Follow Laravel naming conventions: PascalCase for classes, camelCase for methods, snake_case for database columns.
- Controllers should stay thin — delegate logic to `app/Services`.
- Use Laravel's built-in validation (`Form Requests`) for all incoming API data, especially file uploads (ID photos, selfies).
- Use Eloquent models (`app/Models`) for database access; avoid raw SQL unless necessary.
- All API responses should return consistent JSON shape: `{ "success": bool, "data": ..., "message": string }`.
- New features should include a corresponding Pest test in `tests/Feature`.

## Auth & Security
- Resident accounts require ID verification before certificate requests are unlocked (see `Document Requests Locked` state in the mobile UI).
- Handle file uploads (ID front scan, selfie, verification documents) securely — validate file type/size, store outside public web root when possible.
- Use Laravel Sanctum (or existing auth guard) for mobile API authentication — confirm which is already configured in `config/`.

## Mobile Integration
- Mobile app calls the backend via `mobile/src/services/api.ts` — ensure new backend endpoints match the request/response shapes expected there.
- Match the resident flow: Sign In → Registration (facial photo, barangay/residence, identity, ID verification, mobile credentials) → Home Dashboard (certifications, document requests) → Profile & Pass.
- Certificate types currently supported: Barangay Clearance, Certificate of Indigency, Certificate of Residency — new certificate types should follow the same request/approval pattern.

## When Generating Code
- Match existing file/folder structure — don't introduce new architectural patterns without reason.
- Prefer editing/extending existing service classes over creating duplicate logic.
- Keep migrations additive (don't rewrite old migrations) — use `php artisan make:migration` for schema changes.
- Write or update Pest tests alongside any new backend logic.