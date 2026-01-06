import { GovernanceService } from '../services/GovernanceService';
import type { RoleChangeRequestDto } from '../api/web-api-client';

export const GovernanceHelper = {
    loadRequests: async (
        setRequests: (data: RoleChangeRequestDto[]) => void,
        setIsLoading: (loading: boolean) => void,
        setError: (msg: string) => void
    ) => {
        setIsLoading(true);
        try {
            const data = await GovernanceService.getAllRequests();
            setRequests(data);
            setError('');
        } catch (error) {
            console.error("Helper: Failed to load requests", error);
            setError("Konnte Anträge nicht laden. (Serverfehler)");

            // Fallback Mock Data for Development
            const mock1 = { id: 1, requestedByUserId: 99, requestedByName: "Max Muster", newRoleName: "Conductor", createdAt: new Date() } as unknown as RoleChangeRequestDto;

            const mock2 = { id: 2, requestedByUserId: 100, requestedByName: "Lisa Meier", newRoleName: "Board", createdAt: new Date() } as unknown as RoleChangeRequestDto;

            setRequests([mock1, mock2]);
        } finally {
            setIsLoading(false);
        }
    },

    approveRequest: async (
        id: number,
        currentRequests: RoleChangeRequestDto[],
        setRequests: (data: RoleChangeRequestDto[]) => void
    ) => {
        if (!confirm("Diesen Antrag wirklich genehmigen?")) return;

        try {
            await GovernanceService.approveRequest(id);
            setRequests(currentRequests.filter(r => r.id !== id));
            alert("Genehmigt!");
        } catch (error: any) {
            console.error("Helper: Approval failed", error);
            alert("Fehler: " + (error.message || "Unbekannt"));
        }
    }
};
