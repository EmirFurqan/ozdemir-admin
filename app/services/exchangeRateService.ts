import { fetchAPI } from "../lib/api";

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
        return fetchAPI(`/exchange-rates/${id}`, {
            method: "PUT",
            body: JSON.stringify({ rate }),
        });
    },

    syncLiveRates: async (): Promise<ExchangeRate[]> => {
        return (await fetchAPI("/exchange-rates/sync-live", { method: "POST" })) || [];
    }
};
