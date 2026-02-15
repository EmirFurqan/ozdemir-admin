'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";

export async function saveBanner(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const displayOrder = formData.get("displayOrder") as string;
    const isActive = formData.get("isActive") === "true";

    const bannerData = {
        title,
        description,
        linkUrl,
        imageUrl,
        displayOrder: parseInt(displayOrder) || 0,
        isActive,
        active: isActive
    };

    try {
        const method = (id && id !== "new") ? "PUT" : "POST";
        const url = (id && id !== "new") ? `/admin/banners/${id}` : "/admin/banners";

        await fetchAPI(url, {
            method: method,
            body: JSON.stringify(bannerData),
        });

        revalidatePath("/banners");
        return { success: true, message: "Banner başarıyla kaydedildi." };
    } catch (error) {
        console.error("Failed to save banner:", error);
        return { success: false, message: "Banner kaydedilemedi: " + (error as Error).message };
    }
}

export async function deleteBanner(id: number) {
    try {
        await fetchAPI(`/admin/banners/${id}`, {
            method: "DELETE",
        });
        revalidatePath("/banners");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete banner:", error);
        return { success: false, message: "Banner silinemedi." };
    }
}

export async function reorderBanners(ids: number[]) {
    try {
        await fetchAPI("/admin/banners/reorder", {
            method: "POST",
            body: JSON.stringify(ids)
        });
        revalidatePath("/banners");
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder banners:", error);
        return { success: false, message: "Sıralama güncellenemedi." };
    }
}
