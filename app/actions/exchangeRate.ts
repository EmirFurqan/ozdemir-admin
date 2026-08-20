'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";

export async function updateExchangeRateAction(id: number, rate: number) {
    try {
        const result = await fetchAPI(`/exchange-rates/${id}`, {
            method: "PUT",
            body: JSON.stringify({ rate }),
        });
        revalidatePath("/exchange-rates");
        revalidatePath("/");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to update exchange rate via server action:", error);
        return { success: false, message: error?.message || "Kur güncellenemedi." };
    }
}

export async function syncLiveExchangeRatesAction() {
    try {
        const result = await fetchAPI("/exchange-rates/sync-live", {
            method: "POST",
        });
        revalidatePath("/exchange-rates");
        revalidatePath("/");
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Failed to sync live rates via server action:", error);
        return { success: false, message: error?.message || "Canlı kurlar çekilemedi." };
    }
}
