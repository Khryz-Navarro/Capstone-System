import { AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ResidentSelectionAlert() {
    return (
        <Alert className="mb-4">
            <AlertTriangleIcon />
            <AlertTitle>Select a resident account</AlertTitle>
            <AlertDescription>
                Choose a barangay and resident from the header selectors to manage resident features as that account.
            </AlertDescription>
        </Alert>
    );
}
