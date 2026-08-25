<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: 'DejaVu Sans', sans-serif; }
        @page { margin: 30px 45px; }
        body { color: #1f2937; font-size: 12px; }
        .frame { border: 3px double #1e3a8a; padding: 28px 32px; min-height: 980px; position: relative; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; }
        .republic { font-size: 12px; letter-spacing: 1px; }
        .brgy-name { font-size: 20px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 4px 0; }
        .office { font-size: 12px; font-weight: bold; }
        .muted { color: #6b7280; }
        .title { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 34px 0 24px; color: #1e3a8a; }
        .body-text { text-align: justify; line-height: 1.9; font-size: 13px; margin: 0 10px; }
        .strong { font-weight: bold; text-transform: uppercase; }
        .meta-table { width: 100%; margin-top: 26px; font-size: 12px; }
        .meta-table td { padding: 4px 6px; vertical-align: top; }
        .signature { margin-top: 70px; text-align: right; padding-right: 20px; }
        .sign-name { font-weight: bold; text-transform: uppercase; border-top: 1px solid #1f2937; display: inline-block; padding-top: 4px; min-width: 230px; text-align: center; }
        .footer { position: absolute; bottom: 18px; left: 32px; right: 32px; border-top: 1px solid #d1d5db; padding-top: 8px; font-size: 10px; color: #6b7280; }
        .qr { text-align: center; }
        .qr img { width: 110px; height: 110px; }
        .cert-no { position: absolute; top: 28px; right: 32px; font-size: 11px; font-weight: bold; color: #b91c1c; }
    </style>
</head>
<body>
<div class="frame">
    <div class="cert-no">No. {{ $certificateNumber }}</div>

    <div class="header">
        <div class="republic">Republic of the Philippines</div>
        <div class="muted">{{ $barangay->province ?? 'Province' }} &middot; {{ $barangay->city ?? 'City/Municipality' }}</div>
        <div class="brgy-name">Barangay {{ $barangay->name }}</div>
        <div class="office">OFFICE OF THE PUNONG BARANGAY</div>
    </div>

    <div class="title">{{ $documentType->name }}</div>

    <div class="body-text">
        <p>TO WHOM IT MAY CONCERN:</p>

        <p>
            This is to certify that
            <span class="strong">{{ $profile?->fullName() ?? $request->resident->name }}</span>,
            @if ($profile?->civil_status){{ ucfirst($profile->civil_status->value) }}, @endif
            @if ($profile?->gender){{ ucfirst($profile->gender->value) }}, @endif
            is a bona fide resident of
            {{ trim(($profile?->purok ? $profile->purok.', ' : '').($profile?->street ? $profile->street.', ' : '')) }}
            Barangay {{ $barangay->name }}, {{ $barangay->city ?? '' }}, {{ $barangay->province ?? '' }}.
        </p>

        <p>
            This certification is issued upon the request of the above-named person
            @if ($request->purpose) for the purpose of <span class="strong">{{ $request->purpose }}</span> @endif
            and is valid only for the said purpose.
        </p>

        <p>
            Issued this {{ $issuedAt->format('jS') }} day of {{ $issuedAt->format('F Y') }} at
            Barangay {{ $barangay->name }}, {{ $barangay->city ?? '' }}.
        </p>
    </div>

    <div class="signature">
        <div class="sign-name">{{ $barangay->captain ?? 'Punong Barangay' }}</div>
        <div class="muted">Punong Barangay</div>
    </div>

    <table class="meta-table">
        <tr>
            <td style="width: 70%;">
                <strong>Reference No.:</strong> {{ $request->reference_number }}<br>
                <strong>Certificate No.:</strong> {{ $certificateNumber }}<br>
                <strong>Date Issued:</strong> {{ $issuedAt->format('F j, Y') }}<br>
                <strong>Fee:</strong> {{ $request->fee > 0 ? 'PHP '.number_format((float) $request->fee, 2) : 'Free' }}
            </td>
            <td class="qr" style="width: 30%;">
                <img src="{{ $qr }}" alt="QR Code">
                <div style="font-size: 9px;" class="muted">Scan to verify</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        This is a system-generated document from {{ config('app.name', 'DocuLink') }}. Verify authenticity at {{ $verifyUrl }}
    </div>
</div>
</body>
</html>
