'use server'

import { fetchAPI } from "@/app/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveCatalog(prevState: any, formData: FormData) {
    const id = formData.get("id");
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const url = formData.get("url") as string;
    const imgUrl = formData.get("imgUrl") as string;
    const type = formData.get("type") as string;
    const releaseDate = formData.get("releaseDate") as string;

    const catalogData = {
        name,
        description,
        url,
        imgUrl,
        type: type || "PDF",
        releaseDate
    };

    try {
        const method = (id && id !== "new") ? "PUT" : "POST";
        const endpoint = (id && id !== "new") ? `/admin/catalogs/${id}` : "/admin/catalogs";

        const res = await fetchAPI(endpoint, {
            method: method,
            body: JSON.stringify(catalogData),
        });

        revalidatePath("/catalogs");
        revalidatePath("/public/catalogs"); // Revalidate public cache if needed
    } catch (error) {
        console.error("Failed to save catalog:", error);
        return { success: false, message: "Katalog kaydedilemedi: " + (error as Error).message };
    }

    // Redirect to list after success
    if (!id || id === "new") {
        redirect("/catalogs");
    } else {
        redirect("/catalogs");
    }
}

export async function deleteCatalog(id: number) {
    try {
        await fetchAPI(`/admin/catalogs/${id}`, {
            method: "DELETE",
        });
        revalidatePath("/catalogs");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete catalog:", error);
        return { success: false, message: "Katalog silinemedi." };
    }
}
