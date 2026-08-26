'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";

export async function fetchGroupTierDiscountsAction(groupId: number) {
    try {
        const data = await fetchAPI(`/admin/tier-discounts/group/${groupId}`, { cache: "no-store" });
        return data || [];
    } catch (error) {
        console.error("fetchGroupTierDiscountsAction error:", error);
        return [];
    }
}

export async function saveGroupTierDiscountsAction(groupId: number, tierDiscounts: Record<string, number>, applyToProducts: boolean = true) {
    try {
        const res = await fetchAPI("/admin/tier-discounts/group", {
            method: "POST",
            body: JSON.stringify({
                productGroupId: groupId,
                tierDiscounts,
                applyToProducts
            })
        });
        revalidatePath("/product-groups");
        return { success: true, discounts: res };
    } catch (error: any) {
        console.error("saveGroupTierDiscountsAction error:", error);
        return { success: false, message: error.message || "İskontolar kaydedilemedi." };
    }
}
