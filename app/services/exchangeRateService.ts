import { fetchAPI } from "../lib/api";
import { updateExchangeRateAction, syncLiveExchangeRatesAction } from "../actions/exchangeRate";

export interface ExchangeRate {
    id: number;
    currencyCode: string;
    currencyName: string;
    currencySymbol: string;
    currencyId: number;
    rate: number;
    updatedAt: string;
}

export const exchangeRateService = {
    getAllRates: async (): Promise<ExchangeRate[]> => {
        return (await fetchAPI("/exchange-rates")) || [];
    },

    updateRate: async (id: number, rate: number): Promise<ExchangeRate | null> => {
        // Try server action first
        const res = await updateExchangeRateAction(id, rate);
        if (res.success && res.data) {
            return res.data;
        }
        // Fallback to fetchAPI
        return fetchAPI(`/exchange-rates/${id}`, {
            method: "PUT",
            body: JSON.stringify({ rate }),
        });
    },

    syncLiveRates: async (): Promise<ExchangeRate[]> => {
        // Try server action first
        const res = await syncLiveExchangeRatesAction();
        if (res.success && res.data) {
            return res.data;
        }
        // Fallback to fetchAPI
        return (await fetchAPI("/exchange-rates/sync-live", { method: "POST" })) || [];
    }
};
